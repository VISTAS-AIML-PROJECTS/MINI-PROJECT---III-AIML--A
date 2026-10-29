"""Legacy sequential CatV2TON webcam workflow retained for compatibility."""

from __future__ import annotations

from queue import Empty, Queue
from pathlib import Path
from threading import Thread
import time
import tkinter as tk
from tkinter import filedialog

import cv2
from PIL import Image, ImageTk

from run_single_tryon import (
    DEFAULT_OUTPUT_DIR,
    build_automasker,
    build_pipeline,
    run_tryon,
)


WINDOW = "ZVTON2 VIRTUAL TRY-ON"
PROJECT_DIR = Path(__file__).resolve().parent
FRAME_PATH = DEFAULT_OUTPUT_DIR / "latest_capture.jpg"
RESULT_PATH = DEFAULT_OUTPUT_DIR / "latest_result.png"
PREVIEW_SIZE = (640, 480)


class WebcamTryOnApp:
    def __init__(self):
        self.garment_path = None
        self.latest_frame = None
        self.result_image = None
        self.inference_running = False
        self.live_mode = False
        self.camera_fps = 0
        self.preview_frames = 0
        self.preview_fps_started_at = time.perf_counter()
        self.last_inference_seconds = None
        self.status_message = "Camera ready"
        self.events = Queue()
        DEFAULT_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        print("Loading ZvTon2 once; the window opens after local models are ready...")
        self.pipeline = build_pipeline()
        self.automasker = build_automasker()

    def _select_garment(self):
        chosen = filedialog.askopenfilename(
            title="Select garment",
            initialdir=str(self.garment_path.parent if self.garment_path else PROJECT_DIR),
            initialfile=self.garment_path.name if self.garment_path else "",
            filetypes=[("Garment images", "*.jpg *.jpeg *.png *.webp")],
        )
        if chosen:
            self.garment_path = Path(chosen)
            self.status_message = f"Selected {self.garment_path.name}"
            self._update_status()
            print("Using garment:", self.garment_path)

    def _capture_and_try_on(self):
        if self.live_mode:
            return
        self.live_mode = True
        self.status_message = "Live try-on started"
        self._refresh_live_controls()
        self._update_status()
        self._submit_latest_frame()

    def _stop_live(self):
        self.live_mode = False
        self.status_message = "Stopping after current inference" if self.inference_running else "Live stopped"
        self._refresh_live_controls()
        self._update_status()

    def _submit_latest_frame(self):
        if not self.live_mode or self.inference_running:
            return
        if self.latest_frame is None:
            self.status_message = "Waiting for camera frame"
            self._update_status()
            self.root.after(30, self._submit_latest_frame)
            return
        if self.garment_path is None or not self.garment_path.is_file():
            self.live_mode = False
            self.status_message = "Select a garment first"
            self._refresh_live_controls()
            self._update_status()
            return
        frame = self.latest_frame.copy()
        garment_path = self.garment_path
        self.inference_running = True
        self.status_message = f"Running ZvTon2 with {garment_path.name}"
        self._update_status()
        Thread(target=self._run_inference, args=(frame, garment_path), daemon=True).start()

    def _run_inference(self, frame, garment_path):
        try:
            started_at = time.perf_counter()
            if not cv2.imwrite(str(FRAME_PATH), frame):
                raise RuntimeError(f"Could not save captured frame to {FRAME_PATH}")
            print("Captured frame:", FRAME_PATH)
            person = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            garment = Image.open(garment_path).convert("RGB")
            result = run_tryon(
                self.pipeline,
                self.automasker,
                person,
                garment,
                steps=8,
                guidance=3.0,
                garment_path=garment_path,
            )
            result.save(RESULT_PATH)
            if not RESULT_PATH.is_file() or RESULT_PATH.stat().st_size == 0:
                raise RuntimeError("ZvTon2 did not produce latest_result.png")
            print("Result saved:", RESULT_PATH)
            elapsed = time.perf_counter() - started_at
            self.events.put(("complete", (result.copy(), elapsed, garment_path.name)))
        except Exception as exc:
            print("Try-on failed:", exc)
            self.events.put(("error", str(exc)))

    @staticmethod
    def _fit_preview(image):
        image = image.copy()
        image.thumbnail(PREVIEW_SIZE, Image.Resampling.LANCZOS)
        return ImageTk.PhotoImage(image)

    def _update_previews(self):
        ok, frame = self.capture.read()
        if ok:
            self.latest_frame = frame
            self.preview_frames += 1
            now = time.perf_counter()
            elapsed = now - self.preview_fps_started_at
            if elapsed >= 1:
                self.camera_fps = round(self.preview_frames / elapsed)
                self.preview_frames = 0
                self.preview_fps_started_at = now
            frame_image = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            self.camera_photo = self._fit_preview(frame_image)
            self.camera_preview.configure(image=self.camera_photo, text="")
            self._update_status()
        self.root.after(30, self._update_previews)

    def _update_status(self):
        inference = (
            f"{self.last_inference_seconds:.1f}s"
            if self.last_inference_seconds is not None
            else "--"
        )
        self.status.set(
            f"CAMERA: {self.camera_fps} FPS  |  INFERENCE: {inference}  |  STATUS: {self.status_message}"
        )

    def _refresh_live_controls(self):
        self.capture_button.configure(state=tk.DISABLED if self.live_mode else tk.NORMAL)
        self.stop_button.configure(state=tk.NORMAL if self.live_mode else tk.DISABLED)

    def _poll_events(self):
        try:
            while True:
                event, value = self.events.get_nowait()
                if event == "complete":
                    result, elapsed, garment_name = value
                    self.result_image = result
                    self.result_photo = self._fit_preview(result)
                    self.result_preview.configure(image=self.result_photo, text="")
                    self.last_inference_seconds = elapsed
                    self.inference_running = False
                    self.status_message = f"Live | updated with {garment_name}" if self.live_mode else "Complete"
                    self._refresh_live_controls()
                    self._update_status()
                    if self.live_mode:
                        self.root.after(1, self._submit_latest_frame)
                elif event == "error":
                    self.inference_running = False
                    self.live_mode = False
                    self.status_message = f"Error: {value}"
                    self._refresh_live_controls()
                    self._update_status()
        except Empty:
            pass
        self.root.after(100, self._poll_events)

    def _close(self):
        self.live_mode = False
        self.capture.release()
        self.root.destroy()

    def run(self):
        self.capture = cv2.VideoCapture(0, cv2.CAP_DSHOW)
        if not self.capture.isOpened():
            raise RuntimeError("Could not open webcam using cv2.CAP_DSHOW")
        print("Camera opened. Tkinter controls are ready.")
        self.root = tk.Tk()
        self.root.title(WINDOW)
        self.root.geometry("1380x650")
        self.root.minsize(1100, 580)
        self.root.protocol("WM_DELETE_WINDOW", self._close)

        controls = tk.Frame(self.root, padx=12, pady=10)
        controls.pack(fill=tk.X)
        self.capture_button = tk.Button(
            controls,
            text="CAPTURE / START LIVE",
            command=self._capture_and_try_on,
            height=2,
            width=23,
            font=("Segoe UI", 11, "bold"),
            bg="#246b45",
            fg="white",
            activebackground="#1c5436",
        )
        self.capture_button.pack(side=tk.LEFT, padx=(0, 10))
        self.stop_button = tk.Button(
            controls,
            text="STOP LIVE",
            command=self._stop_live,
            height=2,
            width=12,
            font=("Segoe UI", 11, "bold"),
            bg="#9c3434",
            fg="white",
            state=tk.DISABLED,
        )
        self.stop_button.pack(side=tk.LEFT, padx=8)
        tk.Button(
            controls,
            text="SELECT GARMENT",
            command=self._select_garment,
            height=2,
            width=18,
            font=("Segoe UI", 11, "bold"),
        ).pack(side=tk.LEFT, padx=10)
        tk.Button(
            controls,
            text="QUIT",
            command=self._close,
            height=2,
            width=12,
            font=("Segoe UI", 11, "bold"),
            bg="#424b4d",
            fg="white",
        ).pack(side=tk.LEFT, padx=10)
        self.status = tk.StringVar(value="")
        tk.Label(controls, textvariable=self.status, anchor=tk.W, font=("Segoe UI", 11)).pack(
            side=tk.LEFT, padx=18, fill=tk.X, expand=True
        )
        self._update_status()

        previews = tk.Frame(self.root, padx=12, pady=4)
        previews.pack(fill=tk.BOTH, expand=True)
        previews.columnconfigure(0, weight=1)
        previews.columnconfigure(1, weight=1)
        previews.rowconfigure(1, weight=1)
        tk.Label(previews, text="LIVE CAMERA", font=("Segoe UI", 12, "bold")).grid(
            row=0, column=0, sticky=tk.W, padx=4, pady=(0, 6)
        )
        tk.Label(previews, text="VIRTUAL TRY-ON RESULT", font=("Segoe UI", 12, "bold")).grid(
            row=0, column=1, sticky=tk.W, padx=4, pady=(0, 6)
        )
        camera_frame = tk.Frame(previews, width=640, height=480, bg="#171a18")
        camera_frame.grid(row=1, column=0, sticky=tk.NSEW, padx=4)
        camera_frame.grid_propagate(False)
        self.camera_preview = tk.Label(camera_frame, bg="#171a18", fg="white", text="Waiting for camera...")
        self.camera_preview.pack(fill=tk.BOTH, expand=True)
        result_frame = tk.Frame(previews, width=640, height=480, bg="#171a18")
        result_frame.grid(row=1, column=1, sticky=tk.NSEW, padx=4)
        result_frame.grid_propagate(False)
        self.result_preview = tk.Label(result_frame, bg="#171a18", fg="white", text="Result appears here after capture")
        self.result_preview.pack(fill=tk.BOTH, expand=True)

        self._update_previews()
        self._poll_events()
        self.root.mainloop()


if __name__ == "__main__":
    WebcamTryOnApp().run()
