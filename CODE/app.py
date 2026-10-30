
import os
from datetime import datetime, date

from flask import (
    Flask, render_template, request, redirect,
    url_for, session, flash, abort
)
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import or_


# =========================================================
# 1. APPLICATION CONFIGURATION
# =========================================================

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get(
    "SECRET_KEY",
    "smart-donation-development-key-change-this"
)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///smart_donation.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)


# =========================================================
# 2. DATABASE MODELS
# =========================================================

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password = db.Column(db.String(255), nullable=True)
    user_type = db.Column(db.String(30), nullable=False)
    phone = db.Column(db.String(30))
    location = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class Donation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    quantity = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(200), nullable=False)
    required_date = db.Column(db.String(50))
    donor_type = db.Column(db.String(50))
    donor_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    status = db.Column(db.String(30), default="Available")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    donor = db.relationship("User", foreign_keys=[donor_id])

    @property
    def available_date(self):
        return self.required_date or "Not specified"


class Requirement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    quantity = db.Column(db.String(100), nullable=False)
    beneficiary_type = db.Column(db.String(50))
    location = db.Column(db.String(200), nullable=False)
    required_date = db.Column(db.String(50))
    beneficiary_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    status = db.Column(db.String(30), default="Active")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    beneficiary = db.relationship("User", foreign_keys=[beneficiary_id])


class Match(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    donation_id = db.Column(db.Integer, db.ForeignKey("donation.id"), nullable=False)
    requirement_id = db.Column(db.Integer, db.ForeignKey("requirement.id"), nullable=False)
    donor_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    beneficiary_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    status = db.Column(db.String(30), default="Pending")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    donation = db.relationship("Donation")
    requirement = db.relationship("Requirement")
    donor = db.relationship("User", foreign_keys=[donor_id])
    beneficiary = db.relationship("User", foreign_keys=[beneficiary_id])


class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    donation_id = db.Column(db.Integer, db.ForeignKey("donation.id"))
    requirement_id = db.Column(db.Integer, db.ForeignKey("requirement.id"))
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User")
    donation = db.relationship("Donation")
    requirement = db.relationship("Requirement")


def create_notification(user_id, message, donation_id=None, requirement_id=None):
    notification = Notification(
        user_id=user_id,
        message=message,
        donation_id=donation_id,
        requirement_id=requirement_id
    )
    db.session.add(notification)



class Verification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    user_type = db.Column(db.String(30))
    document_type = db.Column(db.String(100))
    document_number = db.Column(db.String(100))
    status = db.Column(db.String(30), default="Pending")
    anomaly_status = db.Column(db.String(50), default="Not Checked")
    anomaly_score = db.Column(db.Float, default=0.0)
    admin_comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User")


# =========================================================
# 3. HELPER FUNCTIONS
# =========================================================

def current_user():
    user_id = session.get("user_id")
    if not user_id:
        return None
    return db.session.get(User, user_id)


def login_required_user():
    user = current_user()
    if user is None:
        session.clear()
    return user


def form_value(*names, default=""):
    for name in names:
        value = request.form.get(name)
        if value is not None:
            return value.strip()
    return default or ""


def parse_form_date(value):
    if not value:
        return ""
    value = value.strip()
    try:
        return date.fromisoformat(value).isoformat()
    except ValueError:
        return value


def create_notification(
    user_id, message, donation_id=None, requirement_id=None
):
    db.session.add(Notification(
        user_id=user_id,
        message=message,
        donation_id=donation_id,
        requirement_id=requirement_id
    ))


def category_location_match(donation, requirement):
    category_matches = (
        (donation.category or "").strip().lower()
        == (requirement.category or "").strip().lower()
    )
    location_matches = (
        (donation.location or "").strip().lower()
        == (requirement.location or "").strip().lower()
    )
    return category_matches and location_matches


# =========================================================
# 4. HOME PAGE
# =========================================================

@app.route("/")
def index():
    return render_template("index.html")


# =========================================================
# 5. REGISTRATION
# =========================================================

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        name = form_value("name", "full_name")
        email = form_value("email").lower()
        password = request.form.get("password", "")
        phone = form_value("phone")
        location = form_value("location")
        user_type = form_value("user_type", "role").lower()

        if user_type == "donator":
            user_type = "donor"
        if user_type in ("receiver", "recipient"):
            user_type = "beneficiary"

        if not name or not email or not password or not user_type:
            flash("Please complete all required fields.", "error")
            return redirect(url_for("register"))

        if user_type not in ("donor", "beneficiary"):
            flash("Please choose Donor or Beneficiary.", "error")
            return redirect(url_for("register"))

        if len(password) < 8:
            flash("Password must contain at least 8 characters.", "error")
            return redirect(url_for("register"))

        if User.query.filter_by(email=email).first():
            flash("An account with this email already exists.", "error")
            return redirect(url_for("login"))

        user = User(
            name=name,
            email=email,
            password=generate_password_hash(password),
            user_type=user_type,
            phone=phone,
            location=location
        )
        db.session.add(user)
        db.session.commit()

        flash("Registration successful. Please sign in.", "success")
        return redirect(url_for("login"))

    return render_template("register.html")


# =========================================================
# 6. LOGIN
# =========================================================

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = form_value("email").lower()
        password = request.form.get("password", "")

        user = User.query.filter_by(email=email).first()

        if user is None:
            flash("Account not found. Please register first.", "error")
            return redirect(url_for("login"))

        if not user.password or not check_password_hash(user.password, password):
            flash("Incorrect password.", "error")
            return redirect(url_for("login"))

        session.clear()
        session["user_id"] = user.id
        session["user_name"] = user.name
        session["user_type"] = user.user_type
        session["user_email"] = user.email

        flash("Login successful!", "success")
        return redirect(url_for("dashboard"))

    return render_template("login.html")


@app.route("/google-login")
def google_login():
    flash(
        "Google sign-in is not configured yet. Please use email and password.",
        "error"
    )
    return redirect(url_for("login"))


@app.route("/google-callback")
def google_callback():
    flash("Google sign-in is not configured.", "error")
    return redirect(url_for("login"))


# =========================================================
# 7. DASHBOARD
# =========================================================

@app.route("/dashboard")
def dashboard():
    user = login_required_user()

    if user is None:
        flash("Please sign in to continue.", "error")
        return redirect(url_for("login"))

    user_donations = Donation.query.order_by(
        Donation.created_at.desc()
    ).all()

    user_requirements = Requirement.query.order_by(
        Requirement.created_at.desc()
    ).all()

    user_notifications = Notification.query.filter_by(
        user_id=user.id
    ).order_by(
        Notification.created_at.desc()
    ).limit(5).all()

    return render_template(
        "dashboard.html",
        user=user,
        donations=user_donations,
        requirements=user_requirements,
        notifications=user_notifications
    )


# =========================================================
# 8. PROFILE AND SETTINGS
# =========================================================

@app.route("/profile")
def profile():
    user = login_required_user()
    if user is None:
        flash("Please sign in to view your profile.", "error")
        return redirect(url_for("login"))

    return render_template("profile.html", user=user)


@app.route("/settings", methods=["GET", "POST"])
def settings():
    user = login_required_user()
    if user is None:
        flash("Please sign in first.", "error")
        return redirect(url_for("login"))

    if request.method == "POST":
        user.name = form_value("name", default=user.name)
        user.phone = form_value("phone", default=user.phone or "")
        user.location = form_value("location", default=user.location or "")

        db.session.commit()
        session["user_name"] = user.name

        flash("Your settings have been saved.", "success")
        return redirect(url_for("settings"))

    return render_template("settings.html", user=user)


# =========================================================
# 9. POST DONATION
# =========================================================

@app.route("/post-donation", methods=["GET", "POST"])
@app.route("/post_donation", methods=["GET", "POST"])
def post_donation():
    user = login_required_user()

    if user is None:
        flash("Please log in first.", "error")
        return redirect(url_for("login"))

    if request.method == "POST":
        title = form_value("title", "donation_title")
        category = form_value("category")
        description = form_value("description")
        quantity = form_value("quantity")
        location = form_value("location", default=user.location or "")
        required_date = parse_form_date(
            form_value("required_date", "available_date", "date")
        )

        # Validate required fields
        if not title or not category or not quantity or not location:
            flash(
                "Please complete the title, category, quantity, and location.",
                "error"
            )
            return redirect(url_for("post_donation"))

        # Create and save the donation
        donation = Donation(
            title=title,
            category=category,
            description=description,
            quantity=quantity,
            location=location,
            required_date=required_date,
            donor_type=user.user_type,
            donor_id=user.id,
            status="Available"
        )

        db.session.add(donation)
        db.session.flush()

        # Find active beneficiary requirements
        active_requirements = Requirement.query.filter_by(
            status="Active"
        ).all()

        matches_created = 0
        notifications_created = 0

        for requirement in active_requirements:

            # A donation should not match the donor's own requirement
            if requirement.beneficiary_id == user.id:
                continue

            # Compare categories without case sensitivity
            same_category = (
                (donation.category or "").strip().lower()
                == (requirement.category or "").strip().lower()
            )

            if not same_category:
                continue

            # Notify the beneficiary about the matching category
            create_notification(
                user_id=requirement.beneficiary_id,
                message=(
                    f"A new donation '{donation.title}' is available "
                    f"in {donation.location}. Check whether it meets "
                    f"your requirement."
                ),
                donation_id=donation.id,
                requirement_id=requirement.id
            )
            notifications_created += 1

            # Check whether the location also matches
            same_location = (
                (donation.location or "").strip().lower()
                == (requirement.location or "").strip().lower()
            )

            if same_location:
                # Avoid duplicate matches
                existing_match = Match.query.filter_by(
                    donation_id=donation.id,
                    requirement_id=requirement.id
                ).first()

                if existing_match is None:
                    new_match = Match(
                        donation_id=donation.id,
                        requirement_id=requirement.id,
                        donor_id=donation.donor_id,
                        beneficiary_id=requirement.beneficiary_id,
                        status="Pending"
                    )
                    db.session.add(new_match)
                    db.session.flush()

                    matches_created += 1

                    # Notify the donor
                    create_notification(
                        user_id=donation.donor_id,
                        message=(
                            f"Your donation '{donation.title}' matches "
                            f"the requirement '{requirement.title}' "
                            f"in {donation.location}. The match is pending."
                        ),
                        donation_id=donation.id,
                        requirement_id=requirement.id
                    )
                    notifications_created += 1

        # Save donation, matches, and notifications together
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            app.logger.exception("Could not save donation and notifications.")
            flash(
                "The donation could not be saved. Please try again.",
                "error"
            )
            return redirect(url_for("post_donation"))

        flash(
            f"Donation posted successfully! "
            f"{matches_created} location match(es) created and "
            f"{notifications_created} notification(s) generated.",
            "success"
        )

        return redirect(url_for("donations"))

    return render_template("post_donation.html", user=user)


# =========================================================
# 10. DONATION LIST AND DETAILS
# =========================================================

@app.route("/donations")
def donations():
    user = login_required_user()
    if user is None:
        flash("Please sign in first.", "error")
        return redirect(url_for("login"))

    items = Donation.query.order_by(
        Donation.created_at.desc()
    ).all()

    return render_template(
        "donations.html",
        user=user,
        donations=items
    )


@app.route(
    "/donation/<int:donation_id>",
    endpoint="donation_details"
)
@app.route(
    "/donation-details/<int:donation_id>",
    endpoint="donation_details_alias"
)
def donation_details(donation_id):
    user = login_required_user()
    if user is None:
        return redirect(url_for("login"))

    donation = db.session.get(Donation, donation_id)
    if donation is None:
        abort(404)

    return render_template(
        "donation_details.html",
        user=user,
        donation=donation
    )


# =========================================================
# 11. POST BENEFICIARY REQUIREMENT
# =========================================================

@app.route("/post-requirement", methods=["GET", "POST"])
@app.route("/post_requirement", methods=["GET", "POST"])
def post_requirement():
    user = login_required_user()
    if user is None:
        flash("Please log in first.", "error")
        return redirect(url_for("login"))

    if request.method == "POST":
        title = form_value("title", "requirement_title")
        category = form_value("category")
        description = form_value("description")
        quantity = form_value("quantity")
        location = form_value("location", default=user.location or "")
        required_date = parse_form_date(
            form_value("required_date", "date")
        )

        if not title or not category or not quantity or not location:
            flash(
                "Please complete the title, category, quantity, and location.",
                "error"
            )
            return redirect(url_for("post_requirement"))

        requirement = Requirement(
            title=title,
            category=category,
            description=description,
            quantity=quantity,
            beneficiary_type=user.user_type,
            location=location,
            required_date=required_date,
            beneficiary_id=user.id,
            status="Active"
        )
        db.session.add(requirement)
        db.session.flush()

        available_donations = Donation.query.filter_by(
            status="Available"
        ).all()

        for donation in available_donations:
            if (
                donation.category.strip().lower()
                == requirement.category.strip().lower()
            ):
                create_notification(
                    donation.donor_id,
                    "A beneficiary posted a requirement: " + requirement.title,
                    donation_id=donation.id,
                    requirement_id=requirement.id
                )

                if category_location_match(donation, requirement):
                    existing_match = Match.query.filter_by(
                        donation_id=donation.id,
                        requirement_id=requirement.id
                    ).first()

                    if existing_match is None:
                        db.session.add(Match(
                            donation_id=donation.id,
                            requirement_id=requirement.id,
                            donor_id=donation.donor_id,
                            beneficiary_id=requirement.beneficiary_id,
                            status="Pending"
                        ))

                        create_notification(
                            requirement.beneficiary_id,
                            "A donation may match your requirement: "
                            + requirement.title,
                            donation_id=donation.id,
                            requirement_id=requirement.id
                        )

        db.session.commit()
        flash("Requirement posted successfully!", "success")
        return redirect(url_for("requirements"))

    return render_template("post_requirement.html", user=user)


# =========================================================
# 12. REQUIREMENT LIST AND DETAILS
# =========================================================

@app.route("/requirements")
def requirements():
    user = login_required_user()
    if user is None:
        flash("Please sign in first.", "error")
        return redirect(url_for("login"))

    items = Requirement.query.order_by(
        Requirement.created_at.desc()
    ).all()

    return render_template(
        "requirements.html",
        user=user,
        requirements=items
    )


# This endpoint name is needed by dashboard.html:
# url_for("view_needs")
@app.route("/view-needs", endpoint="view_needs")
def view_needs():
    user = login_required_user()
    if user is None:
        flash("Please sign in first.", "error")
        return redirect(url_for("login"))

    items = Requirement.query.order_by(
        Requirement.created_at.desc()
    ).all()

    return render_template(
        "requirements.html",
        user=user,
        requirements=items
    )


@app.route(
    "/requirement/<int:requirement_id>",
    endpoint="requirement_details"
)
@app.route(
    "/requirement-details/<int:requirement_id>",
    endpoint="requirement_details_alias"
)
def requirement_details(requirement_id):
    user = login_required_user()
    if user is None:
        return redirect(url_for("login"))

    requirement = db.session.get(Requirement, requirement_id)
    if requirement is None:
        abort(404)

    return render_template(
        "requirement_details.html",
        user=user,
        requirement=requirement
    )


# =========================================================
# 13. HELP WITH A REQUIREMENT / MATCHING
# =========================================================

@app.route("/help/<int:requirement_id>", methods=["GET", "POST"])
def help_donation(requirement_id):
    user = login_required_user()
    if user is None:
        return redirect(url_for("login"))

    requirement = db.session.get(Requirement, requirement_id)
    if requirement is None:
        abort(404)

    if user.user_type != "beneficiary":
        flash("Only beneficiaries can request help with a requirement.", "error")
        return redirect(url_for("requirements"))

    available_donations = Donation.query.filter_by(
        status="Available"
    ).all()

    matching_donation = next(
        (
            donation for donation in available_donations
            if category_location_match(donation, requirement)
        ),
        None
    )

    if matching_donation is None:
        flash(
            "No donation matching this category and location is available yet.",
            "error"
        )
        return redirect(url_for("requirements"))

    existing_match = Match.query.filter_by(
        donation_id=matching_donation.id,
        requirement_id=requirement.id
    ).first()

    if existing_match is None:
        db.session.add(Match(
            donation_id=matching_donation.id,
            requirement_id=requirement.id,
            donor_id=matching_donation.donor_id,
            beneficiary_id=requirement.beneficiary_id,
            status="Pending"
        ))

        create_notification(
            requirement.beneficiary_id,
            "A possible donation match was found.",
            donation_id=matching_donation.id,
            requirement_id=requirement.id
        )
        create_notification(
            matching_donation.donor_id,
            "A beneficiary may need your donation.",
            donation_id=matching_donation.id,
            requirement_id=requirement.id
        )

        db.session.commit()

    flash("A potential match has been created.", "success")
    return redirect(url_for("matches"))


@app.route("/help-donation/<int:requirement_id>")
def help_donation_alias(requirement_id):
    return redirect(url_for("help_donation", requirement_id=requirement_id))


# =========================================================
# 14. MATCHES
# =========================================================

@app.route("/matches")
def matches():
    user = login_required_user()
    if user is None:
        flash("Please sign in first.", "error")
        return redirect(url_for("login"))

    items = Match.query.filter(
        or_(
            Match.donor_id == user.id,
            Match.beneficiary_id == user.id
        )
    ).order_by(
        Match.created_at.desc()
    ).all()

    return render_template(
        "matches.html",
        user=user,
        matches=items
    )


# =========================================================
# 15. NOTIFICATIONS
# =========================================================

@app.route("/notifications")
def notifications():
    user = login_required_user()
    if user is None:
        flash("Please sign in to view notifications.", "error")
        return redirect(url_for("login"))

    items = Notification.query.filter_by(
        user_id=user.id
    ).order_by(
        Notification.created_at.desc()
    ).all()

    return render_template(
        "notifications.html",
        user=user,
        notifications=items
    )


# =========================================================
# 16. VERIFICATION / KYC
# =========================================================

@app.route("/verification", methods=["GET", "POST"])
@app.route("/kyc-verification", methods=["GET", "POST"])
def verification():
    user = login_required_user()
    if user is None:
        return redirect(url_for("login"))

    if request.method == "POST":
        document_type = form_value("document_type", "document")
        document_number = form_value("document_number", "document_id")

        if not document_type or not document_number:
            flash(
                "Please provide your document type and document number.",
                "error"
            )
            return redirect(url_for("verification"))

        # This is a basic submission record, not official identity verification.
        record = Verification(
            user_id=user.id,
            user_type=user.user_type,
            document_type=document_type,
            document_number=document_number,
            status="Pending",
            anomaly_status="Not Checked",
            anomaly_score=0.0
        )
        db.session.add(record)
        db.session.commit()

        flash("Verification details submitted for review.", "success")
        return redirect(url_for("verification"))

    records = Verification.query.filter_by(
        user_id=user.id
    ).order_by(
        Verification.created_at.desc()
    ).all()

    return render_template(
        "kyc_verification.html",
        user=user,
        verifications=records,
        verification=records[0] if records else None
    )


@app.route("/verify-donor")
def verify_donor():
    user = login_required_user()
    if user is None:
        return redirect(url_for("login"))

    if user.user_type != "donor":
        flash("This page is for donor accounts.", "error")
        return redirect(url_for("dashboard"))

    return render_template("verify_donor.html", user=user)


@app.route("/verify-beneficiary")
def verify_beneficiary():
    user = login_required_user()
    if user is None:
        return redirect(url_for("login"))

    if user.user_type != "beneficiary":
        flash("This page is for beneficiary accounts.", "error")
        return redirect(url_for("dashboard"))

    return render_template("verify_beneficiary.html", user=user)


@app.route("/anomaly-detection")
@app.route("/anomaly_detection")
def anomaly_detection():
    user = login_required_user()
    if user is None:
        return redirect(url_for("login"))

    records = Verification.query.filter_by(
        user_id=user.id
    ).order_by(
        Verification.created_at.desc()
    ).all()

    return render_template(
        "anomaly_detection.html",
        user=user,
        verifications=records
    )


# =========================================================
# 17. LOGOUT
# =========================================================

@app.route("/logout")
def logout():
    session.clear()
    flash("You have been signed out.", "success")
    return redirect(url_for("login"))


# =========================================================
# 18. DATABASE INITIALIZATION
# =========================================================

with app.app_context():
    db.create_all()


# =========================================================
# 19. START SERVER
# =========================================================

if __name__ == "__main__":
    app.run(debug=True)

