import enum


class UserRole(str, enum.Enum):
    citizen = "citizen"
    administrator = "administrator"
    worker = "worker"


class ReportStatus(str, enum.Enum):
    submitted = "submitted"
    under_review = "under_review"
    approved = "approved"
    assigned = "assigned"
    in_progress = "in_progress"
    resolved = "resolved"


class Priority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class AssignmentStatus(str, enum.Enum):
    assigned = "assigned"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"
