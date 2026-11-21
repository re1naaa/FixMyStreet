from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CategoryPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    description: str


class ReportCreate(BaseModel):
    title: str = Field(min_length=3, max_length=140)
    description: str = Field(min_length=10, max_length=3000)
    category_id: int
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    urgency: str = Field(pattern="^(low|medium|high|critical)$")
    neighborhood_id: int | None = None
    photo_path: str | None = None


class CommentCreate(BaseModel):
    body: str = Field(min_length=1, max_length=1000)


class CommentPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    body: str
    author_name: str
    created_at: datetime


class StatusHistoryPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    from_status: str | None
    to_status: str
    note: str
    created_at: datetime


class ReportPublic(BaseModel):
    id: int
    reference_code: str | None
    title: str
    description: str
    category_id: int
    category_name: str
    category_slug: str
    neighborhood_id: int | None
    neighborhood_name: str | None
    latitude: float
    longitude: float
    urgency: str
    priority: str | None
    status: str
    photo_url: str | None
    author_name: str
    vote_count: int
    has_voted: bool
    comment_count: int
    created_at: datetime
    updated_at: datetime


class ReportStats(BaseModel):
    my_reports: int
    resolved_reports: int
    active_reports: int
    community_reports: int


class NotificationPublic(BaseModel):
    id: int
    type: str
    title: str
    body: str
    report_id: int | None
    read: bool
    created_at: datetime


class AchievementPublic(BaseModel):
    code: str
    name: str
    description: str
    earned: bool


class NeighborhoodHealth(BaseModel):
    score: int
    open_issues: int
    resolved_issues: int
    improvement_trend: int
