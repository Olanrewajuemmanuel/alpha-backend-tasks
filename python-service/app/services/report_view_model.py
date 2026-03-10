from pydantic.dataclasses import dataclass


@dataclass
class CompanyViewModel:
    name: str
    ticker: str | None
    sector: str | None
    display_header: str


@dataclass
class PointViewModel:
    content: str
    importance_label: str
    importance_class: str


@dataclass
class MetricViewModel:
    label: str
    value: str


@dataclass
class ReportViewModel:
    id: str
    title: str
    generated_at: str
    company: CompanyViewModel
    analyst_name: str
    summary: str
    recommendation: str
    key_points: list[PointViewModel]
    risks: list[PointViewModel]
    metrics: list[MetricViewModel]
    has_metrics: bool
    has_risks: bool
    has_key_points: bool
