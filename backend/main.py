# ==========================================
# NOWSHERA EVENTS API
# ==========================================

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from database import supabase

from schemas import (
    EventCreate,
    EventUpdate,
    SignupRequest,
    LoginRequest,
    RegistrationCreate
)

from passlib.context import CryptContext
from jose import jwt

from dotenv import load_dotenv

from datetime import date
import os


# ==========================================
# LOAD ENVIRONMENT VARIABLES
# ==========================================

load_dotenv()


# ==========================================
# FASTAPI APP
# ==========================================

app = FastAPI(title="Nowshera Events API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://nowshera-events-frontend.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# PASSWORD SETTINGS
# ==========================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


# ==========================================
# JWT SETTINGS
# ==========================================

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"


# ==========================================
# AUTHENTICATION SECURITY
# ==========================================

security = HTTPBearer()


# ==========================================
# HOME
# ==========================================

@app.get("/")
def home():

    return {
        "message": "Nowshera Events API is running"
    }


# ==========================================
# TEST DATABASE
# ==========================================

@app.get("/test-database")
def test_database():

    response = (
        supabase
        .table("events")
        .select("*")
        .execute()
    )

    return {
        "message": "Database connection successful",
        "events": response.data
    }


# ==========================================
# AUTHENTICATION
# ==========================================


# ------------------------------------------
# SIGNUP
# ------------------------------------------

@app.post("/signup")
def signup(user: SignupRequest):

    # Check if email already exists
    existing_user = (
        supabase
        .table("users")
        .select("id")
        .eq("email", user.email)
        .execute()
    )

    if existing_user.data:

        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Hash password
    password_hash = pwd_context.hash(
        user.password
    )

    # User data
    # Every normal signup is automatically an attendee
    data = {
        "full_name": user.full_name,
        "email": user.email,
        "password_hash": password_hash,
        "role": "attendee"
    }

    # Insert user
    response = (
        supabase
        .table("users")
        .insert(data)
        .execute()
    )

    return {
        "message": "Account created successfully",
        "user": {
            "id": response.data[0]["id"],
            "full_name": response.data[0]["full_name"],
            "email": response.data[0]["email"],
            "role": response.data[0]["role"]
        }
    }
# ------------------------------------------
# LOGIN
# ------------------------------------------

@app.post("/login")
def login(user: LoginRequest):

    response = (
        supabase
        .table("users")
        .select("*")
        .eq("email", user.email)
        .execute()
    )

    if not response.data:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    existing_user = response.data[0]

    # Check password
    password_correct = pwd_context.verify(
        user.password,
        existing_user["password_hash"]
    )

    if not password_correct:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # JWT data
    token_data = {
        "user_id": existing_user["id"],
        "email": existing_user["email"],
        "role": existing_user["role"]
    }

    # Create token
    access_token = jwt.encode(
        token_data,
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": existing_user["id"],
            "full_name": existing_user["full_name"],
            "email": existing_user["email"],
            "role": existing_user["role"]
        }
    }


# ==========================================
# GET CURRENT USER
# ==========================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    token = credentials.credentials

    try:

        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM]
        )

        user_id = payload.get("user_id")
        email = payload.get("email")
        role = payload.get("role")

        if (
            user_id is None
            or email is None
            or role is None
        ):

            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

        return {
            "user_id": user_id,
            "email": email,
            "role": role
        }

    except Exception:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )


# ==========================================
# GET CURRENT ADMIN
# ==========================================

def get_current_admin(
    current_user: dict = Depends(get_current_user)
):

    if current_user["role"] != "admin":

        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    return current_user


# ==========================================
# ADMIN TEST
# ==========================================

@app.get("/admin-test")
def admin_test(
    current_admin: dict = Depends(get_current_admin)
):

    return {
        "message": "You are an admin",
        "user": current_admin
    }


# ==========================================
# ADMIN EVENT MANAGEMENT
# ==========================================


# ------------------------------------------
# CREATE EVENT
# ------------------------------------------

@app.post("/events")
def create_event(
    event: EventCreate,
    current_admin: dict = Depends(get_current_admin)
):

    # Capacity must be greater than zero
    if event.capacity <= 0:

        raise HTTPException(
            status_code=400,
            detail="Capacity must be greater than 0"
        )

    # Check status
    if event.status not in [
        "draft",
        "published",
        "completed",
        "cancelled"
    ]:

        raise HTTPException(
            status_code=400,
            detail="Invalid event status"
        )

    data = {
        "title": event.title,
        "description": event.description,
        "event_date": event.event_date.isoformat(),
        "event_time": event.event_time.isoformat(),
        "location": event.location,
        "capacity": event.capacity,
        "status": event.status
    }

    response = (
        supabase
        .table("events")
        .insert(data)
        .execute()
    )

    return {
        "message": "Event created successfully",
        "event": response.data
    }


# ------------------------------------------
# GET ALL EVENTS - ADMIN
# ------------------------------------------

@app.get("/events")
def get_events(
    current_admin: dict = Depends(get_current_admin)
):

    response = (
        supabase
        .table("events")
        .select("*")
        .execute()
    )

    return {
        "events": response.data
    }


# ------------------------------------------
# UPDATE EVENT
# ------------------------------------------

@app.put("/events/{event_id}")
def update_event(
    event_id: int,
    event: EventUpdate,
    current_admin: dict = Depends(get_current_admin)
):

    update_data = {}

    # Update title
    if event.title is not None:

        update_data["title"] = event.title

    # Update description
    if event.description is not None:

        update_data["description"] = event.description

    # Update event date
    if event.event_date is not None:

        update_data["event_date"] = (
            event.event_date.isoformat()
        )

    # Update event time
    if event.event_time is not None:

        update_data["event_time"] = (
            event.event_time.isoformat()
        )

    # Update location
    if event.location is not None:

        update_data["location"] = event.location

    # Update capacity
    if event.capacity is not None:

        # Capacity must be greater than zero
        if event.capacity <= 0:

            raise HTTPException(
                status_code=400,
                detail="Capacity must be greater than 0"
            )

        # Count current registered users
        registered_response = (
            supabase
            .table("registrations")
            .select("id")
            .eq("event_id", event_id)
            .eq("status", "registered")
            .execute()
        )

        current_registrations = len(
            registered_response.data
        )

        # Capacity cannot be smaller than
        # current registered users
        if event.capacity < current_registrations:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Capacity cannot be less than "
                    f"current registrations "
                    f"({current_registrations})"
                )
            )

        update_data["capacity"] = event.capacity

    # No changes
    if not update_data:

        raise HTTPException(
            status_code=400,
            detail="No changes provided"
        )

    # Update database
    response = (
        supabase
        .table("events")
        .update(update_data)
        .eq("id", event_id)
        .execute()
    )

    if not response.data:

        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    return {
        "message": "Event updated successfully",
        "event": response.data
    }


# ------------------------------------------
# PUBLISH EVENT
# ------------------------------------------

@app.patch("/events/{event_id}/publish")
def publish_event(
    event_id: int,
    current_admin: dict = Depends(get_current_admin)
):

    # Find event
    event_response = (
        supabase
        .table("events")
        .select("*")
        .eq("id", event_id)
        .execute()
    )

    if not event_response.data:

        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    event = event_response.data[0]

    # Cannot publish cancelled event
    if event["status"] == "cancelled":

        raise HTTPException(
            status_code=400,
            detail="Cancelled event cannot be published"
        )

    # Cannot publish completed event
    if event["status"] == "completed":

        raise HTTPException(
            status_code=400,
            detail="Completed event cannot be published"
        )

    # Event date cannot be in the past
    event_date = date.fromisoformat(
        event["event_date"]
    )

    if event_date < date.today():

        raise HTTPException(
            status_code=400,
            detail="Past event cannot be published"
        )

    response = (
        supabase
        .table("events")
        .update({
            "status": "published"
        })
        .eq("id", event_id)
        .execute()
    )

    return {
        "message": "Event published successfully",
        "event": response.data
    }


# ------------------------------------------
# COMPLETE EVENT
# ------------------------------------------

@app.patch("/events/{event_id}/complete")
def complete_event(
    event_id: int,
    current_admin: dict = Depends(get_current_admin)
):

    event_response = (
        supabase
        .table("events")
        .select("*")
        .eq("id", event_id)
        .execute()
    )

    if not event_response.data:

        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    event = event_response.data[0]

    if event["status"] == "cancelled":

        raise HTTPException(
            status_code=400,
            detail="Cancelled event cannot be completed"
        )

    if event["status"] == "completed":

        raise HTTPException(
            status_code=400,
            detail="Event is already completed"
        )

    response = (
        supabase
        .table("events")
        .update({
            "status": "completed"
        })
        .eq("id", event_id)
        .execute()
    )

    return {
        "message": "Event completed successfully",
        "event": response.data
    }


# ------------------------------------------
# CANCEL EVENT
# ------------------------------------------

@app.patch("/events/{event_id}/cancel")
def cancel_event(
    event_id: int,
    current_admin: dict = Depends(get_current_admin)
):

    event_response = (
        supabase
        .table("events")
        .select("*")
        .eq("id", event_id)
        .execute()
    )

    if not event_response.data:

        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    event = event_response.data[0]

    if event["status"] == "cancelled":

        raise HTTPException(
            status_code=400,
            detail="Event is already cancelled"
        )

    if event["status"] == "completed":

        raise HTTPException(
            status_code=400,
            detail="Completed event cannot be cancelled"
        )

    response = (
        supabase
        .table("events")
        .update({
            "status": "cancelled"
        })
        .eq("id", event_id)
        .execute()
    )

    return {
        "message": "Event cancelled successfully",
        "event": response.data
    }


# ==========================================
# PUBLIC EVENTS
# ==========================================

@app.get("/public/events")
def get_public_events():

    # Get published upcoming events
    response = (
        supabase
        .table("events")
        .select("*")
        .eq("status", "published")
        .gte(
            "event_date",
            date.today().isoformat()
        )
        .order("event_date")
        .order("event_time")
        .execute()
    )

    events = response.data

    # Add places left to every event
    for event in events:

        registrations_response = (
            supabase
            .table("registrations")
            .select("id")
            .eq("event_id", event["id"])
            .eq("status", "registered")
            .execute()
        )

        registered_count = len(
            registrations_response.data
        )

        event["registered_count"] = registered_count

        event["places_left"] = max(
            0,
            event["capacity"] - registered_count
        )

    return {
        "events": events
    }

# ==========================================
# PUBLIC EVENT DETAILS
# ==========================================

@app.get("/public/events/{event_id}")
def get_public_event_details(event_id: int):

    # Find event
    response = (
        supabase
        .table("events")
        .select("*")
        .eq("id", event_id)
        .eq("status", "published")
        .execute()
    )

    if not response.data:

        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    event = response.data[0]

    # Check if event has passed
    event_date = date.fromisoformat(
        event["event_date"]
    )

    if event_date < date.today():

        raise HTTPException(
            status_code=404,
            detail="This event has already passed"
        )

    # Count registrations
    registrations_response = (
        supabase
        .table("registrations")
        .select("id")
        .eq("event_id", event_id)
        .eq("status", "registered")
        .execute()
    )

    registered_count = len(
        registrations_response.data
    )

    # Calculate places left
    places_left = max(
        0,
        event["capacity"] - registered_count
    )

    event["registered_count"] = registered_count
    event["places_left"] = places_left

    return {
        "event": event
    }

# ==========================================
# REGISTER FOR EVENT
# ==========================================

@app.post("/registrations")
def register_for_event(
    registration: RegistrationCreate,
    current_user: dict = Depends(get_current_user)
):

    user_id = current_user["user_id"]
    event_id = registration.event_id

    # --------------------------------------
    # 1. Find event
    # --------------------------------------

    event_response = (
        supabase
        .table("events")
        .select("*")
        .eq("id", event_id)
        .execute()
    )

    if not event_response.data:

        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    event = event_response.data[0]

    # --------------------------------------
    # 2. Event must be published
    # --------------------------------------

    if event["status"] != "published":

        raise HTTPException(
            status_code=400,
            detail=(
                "This event is not available "
                "for registration"
            )
        )

    # --------------------------------------
    # 3. Event cannot be in the past
    # --------------------------------------

    event_date = date.fromisoformat(
        event["event_date"]
    )

    if event_date < date.today():

        raise HTTPException(
            status_code=400,
            detail="This event has already passed"
        )

    # --------------------------------------
    # 4. Check existing registration
    # --------------------------------------

    existing_registration = (
        supabase
        .table("registrations")
        .select("*")
        .eq("user_id", user_id)
        .eq("event_id", event_id)
        .execute()
    )

    if existing_registration.data:

        existing = existing_registration.data[0]

        # Already registered
        if existing["status"] == "registered":

            raise HTTPException(
                status_code=400,
                detail=(
                    "You are already registered "
                    "for this event"
                )
            )

    # --------------------------------------
    # 5. Count active registrations
    # --------------------------------------

    registrations_response = (
        supabase
        .table("registrations")
        .select("id")
        .eq("event_id", event_id)
        .eq("status", "registered")
        .execute()
    )

    current_registrations = len(
        registrations_response.data
    )

    # --------------------------------------
    # 6. Check capacity
    # --------------------------------------

    if current_registrations >= event["capacity"]:

        raise HTTPException(
            status_code=400,
            detail="This event is full"
        )

    # --------------------------------------
    # 7. Reactivate cancelled registration
    # --------------------------------------

    if existing_registration.data:

        existing = existing_registration.data[0]

        response = (
            supabase
            .table("registrations")
            .update({
                "status": "registered"
            })
            .eq("id", existing["id"])
            .eq("user_id", user_id)
            .execute()
        )

        return {
            "message": "Registration successful",
            "registration": response.data
        }

    # --------------------------------------
    # 8. Create new registration
    # --------------------------------------

    registration_data = {
        "user_id": user_id,
        "event_id": event_id,
        "status": "registered"
    }

    response = (
        supabase
        .table("registrations")
        .insert(registration_data)
        .execute()
    )

    return {
        "message": "Registration successful",
        "registration": response.data
    }


# ==========================================
# MY REGISTRATIONS
# ==========================================

@app.get("/my-registrations")
def get_my_registrations(
    current_user: dict = Depends(get_current_user)
):

    user_id = current_user["user_id"]

    response = (
        supabase
        .table("registrations")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    )

    registrations = response.data

    results = []

    for registration in registrations:

        event_response = (
            supabase
            .table("events")
            .select("*")
            .eq("id", registration["event_id"])
            .execute()
        )

        if not event_response.data:
            continue

        event = event_response.data[0]

        results.append({

            "registration_id":
                registration["id"],

            "status":
                registration["status"],

            "registered_at":
                registration["registered_at"],

            "event": {

                "id":
                    event["id"],

                "title":
                    event["title"],

                "description":
                    event["description"],

                "event_date":
                    event["event_date"],

                "event_time":
                    event["event_time"],

                "location":
                    event["location"],

                "capacity":
                    event["capacity"],

                "status":
                    event["status"]

            }

        })


    return {
        "registrations": results
    }


# ==========================================
# CANCEL MY REGISTRATION
# ==========================================

@app.patch("/registrations/{registration_id}/cancel")
def cancel_registration(
    registration_id: int,
    current_user: dict = Depends(get_current_user)
):

    user_id = current_user["user_id"]

    # Find registration belonging to this user
    registration_response = (
        supabase
        .table("registrations")
        .select("*")
        .eq("id", registration_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not registration_response.data:

        raise HTTPException(
            status_code=404,
            detail="Registration not found"
        )

    registration = registration_response.data[0]

    # Already cancelled
    if registration["status"] == "cancelled":

        raise HTTPException(
            status_code=400,
            detail="Registration is already cancelled"
        )

    # Cancel registration
    response = (
        supabase
        .table("registrations")
        .update({
            "status": "cancelled"
        })
        .eq("id", registration_id)
        .eq("user_id", user_id)
        .execute()
    )

    return {
        "message": "Registration cancelled successfully",
        "registration": response.data
    }

# ==========================================
# ADMIN - EVENT ATTENDEES
# ==========================================

@app.get("/admin/events/{event_id}/attendees")
def get_event_attendees(
    event_id: int,
    current_admin: dict = Depends(get_current_admin)
):

    # Check if event exists
    event_response = (
        supabase
        .table("events")
        .select("*")
        .eq("id", event_id)
        .execute()
    )

    if not event_response.data:

        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    event = event_response.data[0]

    # Get registrations for this event
    registrations_response = (
        supabase
        .table("registrations")
        .select("*")
        .eq("event_id", event_id)
        .execute()
    )

    registrations = registrations_response.data

    attendees = []

    # Get user information for each registration
    for registration in registrations:

        user_response = (
            supabase
            .table("users")
            .select("id, full_name, email")
            .eq("id", registration["user_id"])
            .execute()
        )

        if user_response.data:

            user = user_response.data[0]

            attendees.append({
                "registration_id": registration["id"],
                "user_id": user["id"],
                "full_name": user["full_name"],
                "email": user["email"],
                "registered_at": registration["registered_at"],
                "status": registration["status"]
            })

    # Count active registrations
    active_count = sum(
        1
        for attendee in attendees
        if attendee["status"] == "registered"
    )

    return {
        "event": {
            "id": event["id"],
            "title": event["title"],
            "capacity": event["capacity"]
        },
        "total_registrations": len(attendees),
        "active_registrations": active_count,
        "places_left": max(
            0,
            event["capacity"] - active_count
        ),
        "attendees": attendees
    }
# ==========================================
# ADMIN - SEARCH ATTENDEES
# ==========================================

@app.get("/admin/events/{event_id}/attendees/search")
def search_event_attendees(
    event_id: int,
    search: str,
    current_admin: dict = Depends(get_current_admin)
):

    # Check event
    event_response = (
        supabase
        .table("events")
        .select("*")
        .eq("id", event_id)
        .execute()
    )

    if not event_response.data:

        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    # Get registrations
    registrations_response = (
        supabase
        .table("registrations")
        .select("*")
        .eq("event_id", event_id)
        .execute()
    )

    registrations = registrations_response.data

    attendees = []

    search_text = search.lower()

    for registration in registrations:

        user_response = (
            supabase
            .table("users")
            .select("id, full_name, email")
            .eq("id", registration["user_id"])
            .execute()
        )

        if not user_response.data:
            continue

        user = user_response.data[0]

        name = user["full_name"].lower()
        email = user["email"].lower()

        # Search name OR email
        if (
            search_text in name
            or search_text in email
        ):

            attendees.append({
                "registration_id": registration["id"],
                "user_id": user["id"],
                "full_name": user["full_name"],
                "email": user["email"],
                "registered_at": registration["registered_at"],
                "status": registration["status"]
            })

    return {
        "results": attendees,
        "count": len(attendees)
    }
# ==========================================
# ADMIN DASHBOARD
# ==========================================

@app.get("/admin/dashboard")
def admin_dashboard(
    current_admin: dict = Depends(get_current_admin)
):

    # Get all events
    events_response = (
        supabase
        .table("events")
        .select("*")
        .execute()
    )

    events = events_response.data

    # Get all registrations
    registrations_response = (
        supabase
        .table("registrations")
        .select("*")
        .execute()
    )

    registrations = registrations_response.data

    # Event counts
    total_events = len(events)

    published_events = sum(
        1
        for event in events
        if event["status"] == "published"
    )

    completed_events = sum(
        1
        for event in events
        if event["status"] == "completed"
    )

    cancelled_events = sum(
        1
        for event in events
        if event["status"] == "cancelled"
    )

    draft_events = sum(
        1
        for event in events
        if event["status"] == "draft"
    )

    # Registration counts
    total_registrations = len(registrations)

    active_registrations = sum(
        1
        for registration in registrations
        if registration["status"] == "registered"
    )

    cancelled_registrations = sum(
        1
        for registration in registrations
        if registration["status"] == "cancelled"
    )

    return {
        "events": {
            "total": total_events,
            "draft": draft_events,
            "published": published_events,
            "completed": completed_events,
            "cancelled": cancelled_events
        },
        "registrations": {
            "total": total_registrations,
            "active": active_registrations,
            "cancelled": cancelled_registrations
        }
    }