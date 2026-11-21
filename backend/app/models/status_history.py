from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.enums import ReportStatus
from app.utils.time import utcnow


class ReportStatusHistory(Base):
    __tablename__ = "report_status_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    report_id: Mapped[int] = mapped_column(ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True)
    from_status: Mapped[ReportStatus | None] = mapped_column(
        Enum(ReportStatus, native_enum=False, length=32),
        nullable=True,
    )
    to_status: Mapped[ReportStatus] = mapped_column(Enum(ReportStatus, native_enum=False, length=32), nullable=False)
    changed_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    note: Mapped[str] = mapped_column(Text, default="", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    report: Mapped["Report"] = relationship(back_populates="status_history")
    changed_by: Mapped["User | None"] = relationship()
