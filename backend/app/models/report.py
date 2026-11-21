from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Enum, Float, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.enums import Priority, ReportStatus
from app.utils.time import utcnow


class Report(Base):
    __tablename__ = "reports"
    __table_args__ = (
        CheckConstraint("latitude >= -90 AND latitude <= 90", name="ck_reports_latitude"),
        CheckConstraint("longitude >= -180 AND longitude <= 180", name="ck_reports_longitude"),
        Index("ix_reports_status_category", "status", "category_id"),
        Index("ix_reports_location", "latitude", "longitude"),
        Index("ix_reports_created_at", "created_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    reference_code: Mapped[str | None] = mapped_column(String(32), unique=True, nullable=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    neighborhood_id: Mapped[int | None] = mapped_column(
        ForeignKey("neighborhoods.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(140), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    urgency: Mapped[Priority] = mapped_column(Enum(Priority, native_enum=False, length=16), nullable=False)
    priority: Mapped[Priority | None] = mapped_column(
        Enum(Priority, native_enum=False, length=16),
        nullable=True,
    )
    status: Mapped[ReportStatus] = mapped_column(
        Enum(ReportStatus, native_enum=False, length=32),
        default=ReportStatus.submitted,
        nullable=False,
        index=True,
    )
    photo_path: Mapped[str | None] = mapped_column(String(255), nullable=True)
    classification_label: Mapped[str | None] = mapped_column(String(64), nullable=True)
    classification_source: Mapped[str | None] = mapped_column(String(32), nullable=True)
    classification_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
        nullable=False,
    )

    author: Mapped["User"] = relationship(back_populates="reports")
    category: Mapped["Category"] = relationship(back_populates="reports")
    neighborhood: Mapped["Neighborhood | None"] = relationship(back_populates="reports")
    comments: Mapped[list["Comment"]] = relationship(back_populates="report")
    votes: Mapped[list["Vote"]] = relationship(back_populates="report")
    status_history: Mapped[list["ReportStatusHistory"]] = relationship(back_populates="report")
    assignments: Mapped[list["WorkerAssignment"]] = relationship(back_populates="report")
    notifications: Mapped[list["Notification"]] = relationship(back_populates="report")
    internal_notes: Mapped[list["InternalNote"]] = relationship(back_populates="report")
