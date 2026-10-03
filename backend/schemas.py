from pydantic import BaseModel, Field
from datetime import date, time
from typing import Optional


class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    event_date: date
    event_time: time
    location: str
    capacity: int = Field(gt=0)
    status: str = "draft"

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[date] = None
    event_time: Optional[time] = None
    location: Optional[str] = None
    capacity: Optional[int] = None


    # =========================
# AUTHENTICATION SCHEMAS
# =========================

class SignupRequest(BaseModel):
    full_name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


    # =========================
# REGISTRATION SCHEMAS
# =========================

class RegistrationCreate(BaseModel):
    event_id: int