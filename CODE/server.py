"""
Central server - runs ONCE (laptop, college server or cloud VM).

* Loads every Chennai bus route from a GTFS file (chennai-unified-gtfs.zip), so
  you never type route details by hand.
* Each bus Pi reports its own bus ID, its route number and its crowd level.
  A bus is registered automatically the first time it reports.
* The web page lists all reporting buses and lets commuters search any route.

    pip install flask
    1. Download the GTFS zip into this folder (see README note below).
    2. BUS_API_KEY=my-secret python3 server.py     (Windows: set BUS_API_KEY=my-secret)

Download (browser, or: curl -L -o chennai-unified-gtfs.zip <url>):
    https://raw.githubusercontent.com/ungalsoththu/ChennaiGTFS/main/data/chennai-unified-gtfs.zip
Check the dataset's licence terms before using it beyond your project.
"""
import csv
import io
import os
import re
import time
import zipfile
import threading
from collections import deque

from flask import Flask, render_template, jsonify, request

API_KEY = os.environ.get("BUS_API_KEY", "change-me")      # same key on every bus
GTFS_PATH = os.environ.get("GTFS_PATH", os.path.join(os.path.dirname(os.path.abspath(__file__)), "chennai-unified-gtfs.zip"))
OFFLINE_AFTER = 120        # seconds without a report -> "No reading"
REMOVE_AFTER = 600         # seconds without a report -> bus disappears from the list

LEVELS = ("LOW", "MEDIUM", "HIGH")
ID_RE = re.compile(r"^[A-Za-z0-9 _-]{1,30}$")

app = Flask(__name__)
lock = threading.Lock()
buses = {}                 # bus_id -> {"route", "level", "time", "ts", "history"}
ROUTES = {}                # "21G" -> {"route": "21G", "name": "Mogappair West - Redhills"}


def norm_route(r):
    return str(r or "").strip().upper().replace(" ", "")


def load_gtfs(path):
    """Read routes.txt from the GTFS zip and keep the bus routes."""
    if not os.path.exists(path):
        print(f"[warn] GTFS file not found at {path}.\n"
              "       Running in open mode: any route number is accepted and shown without a name.")
        return
    with zipfile.ZipFile(path) as z:
        name = next((n for n in z.namelist() if n.lower().endswith("routes.txt")), None)
        if not name:
            print("[warn] routes.txt not found inside the GTFS zip. Running in open mode.")
            return
        with z.open(name) as f:
            for row in csv.DictReader(io.TextIOWrapper(f, encoding="utf-8-sig")):
                rtype = (row.get("route_type") or "").strip()
                is_bus = rtype == "" or rtype == "3" or (rtype.isdigit() and 700 <= int(rtype) <= 799)
                if not is_bus:                       # skip metro / train lines
                    continue
                short = (row.get("route_short_name") or "").strip()
                long_ = (row.get("route_long_name") or "").strip()
                rid = (row.get("route_id") or "").strip()
                key = norm_route(short or rid)
                if key and key not in ROUTES:
                    ROUTES[key] = {"route": key, "name": long_ or short or rid}
    print(f"[info] Loaded {len(ROUTES)} bus routes from GTFS.")


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/report", methods=["POST"])
def report():
    """Called by each bus every few seconds: {bus_id, route, level}."""
    if request.headers.get("X-API-Key") != API_KEY:
        return jsonify(error="Bad API key"), 401
    body = request.get_json(silent=True) or {}
    bus_id, level = str(body.get("bus_id", "")).strip(), body.get("level")
    route = norm_route(body.get("route"))
    if not ID_RE.match(bus_id):
        return jsonify(error="bus_id must be 1-30 letters, digits, space, - or _"), 400
    if not route:
        return jsonify(error="route is required"), 400
    if ROUTES and route not in ROUTES:
        return jsonify(error=f"Unknown Chennai bus route '{route}'"), 404
    if level not in LEVELS:
        return jsonify(error="level must be LOW, MEDIUM or HIGH"), 400
    stamp = time.strftime("%H:%M:%S")
    with lock:
        b = buses.setdefault(bus_id, {"history": deque(maxlen=60)})
        b.update(route=route, level=level, time=stamp, ts=time.time())
        b["history"].append({"t": stamp, "level": level})
    return jsonify(ok=True)


@app.route("/api/buses")
def list_buses():
    now, out = time.time(), []
    with lock:
        for bus_id in [k for k, b in buses.items() if now - b["ts"] > REMOVE_AFTER]:
            del buses[bus_id]
        for bus_id, b in buses.items():
            age = int(now - b["ts"])
            info = ROUTES.get(b["route"])
            out.append({
                "id": bus_id, "route": b["route"],
                "dest": info["name"] if info else "Route " + b["route"],
                "level": b["level"] if age <= OFFLINE_AFTER else "OFFLINE",
                "time": b["time"], "age": age,
            })
    return jsonify(out)


@app.route("/api/routes")
def search_routes():
    """Search every Chennai route by number or name, with how many buses are live on it."""
    q = norm_route(request.args.get("q", ""))
    if not q or not ROUTES:
        return jsonify([])
    now = time.time()
    with lock:
        live = {}
        for b in buses.values():
            if now - b["ts"] <= OFFLINE_AFTER:
                live[b["route"]] = live.get(b["route"], 0) + 1
    starts = [r for k, r in ROUTES.items() if k.startswith(q)]
    contains = [r for k, r in ROUTES.items()
                if not k.startswith(q) and (q in k or q in r["name"].upper().replace(" ", ""))]
    starts.sort(key=lambda r: (len(r["route"]), r["route"]))
    return jsonify([{**r, "live": live.get(r["route"], 0)} for r in (starts + contains)[:15]])


@app.route("/api/history/<bus_id>")
def history(bus_id):
    with lock:
        return jsonify(list(buses.get(bus_id, {}).get("history", [])))


if __name__ == "__main__":
    load_gtfs(GTFS_PATH)
    app.run(host="0.0.0.0", port=5000, threaded=True)
