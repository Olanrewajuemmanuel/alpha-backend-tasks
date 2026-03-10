from datetime import timezone
from app.models.briefing import Briefing
from app.models.briefing_metric import BriefingMetric
from app.models.briefing_point import BriefingPoint
from app.services.report_view_model import (
    CompanyViewModel,
    MetricViewModel,
    PointViewModel,
    ReportViewModel,
)


class ReportViewContract:
    """
    Presentation contract for transforming briefing to a report view.

    Contract
    ----
    Input:  Briefing  (with .points and .metrics already loaded in memory)
    Output: ReportViewModel  (all fields are display-ready strings or booleans)
    """

    def __init__(self, briefing: Briefing):
        self.briefing = briefing

    def transform(self) -> ReportViewModel:
        briefing = self.briefing
        company = self._build_company(briefing)
        key_points = self._extract_points(briefing, "KEY_POINT")
        risks = self._extract_points(briefing, "RISK")
        metrics = self._build_metrics(briefing)

        return ReportViewModel(
            id=str(briefing.id),
            title=self._build_title(company.display_header),
            generated_at=self._format_timestamp(briefing),
            company=company,
            analyst_name=briefing.analyst_name or "",
            summary=briefing.summary,
            recommendation=briefing.recommendation,
            key_points=key_points,
            risks=risks,
            metrics=metrics,
            has_metrics=len(metrics) > 0,
            has_risks=len(risks) > 0,
            has_key_points=len(key_points) > 0,
        )

    def _build_company(self, briefing: Briefing) -> CompanyViewModel:
        if briefing.ticker:
            display_header = f"{briefing.company_name} ({briefing.ticker.upper()})"
        else:
            display_header = briefing.company_name

        return CompanyViewModel(
            name=briefing.company_name,
            ticker=briefing.ticker,
            sector=briefing.sector,
            display_header=display_header,
        )

    def _build_title(self, company_display_header: str) -> str:
        return f"Company briefing — {company_display_header}"

    def _format_timestamp(self, briefing: Briefing) -> str:
        """Uses generated_at if the report has been generated, otherwise
        falls back to created_at.
        """
        dt = briefing.generated_at or briefing.created_at

        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        else:
            dt = dt.astimezone(timezone.utc)

        return dt.strftime("%d %B %Y, %H:%M UTC").lstrip("0")

    def _extract_points(
        self,
        briefing: Briefing,
        point_type: str,
    ) -> list[PointViewModel]:
        filtered = [p for p in briefing.points if p.point_type == point_type]
        filtered.sort(key=lambda p: p.display_order)
        return [self._format_point(p) for p in filtered]

    def _format_point(self, point: BriefingPoint) -> PointViewModel:
        return PointViewModel(
            content=point.content,
            importance_label="",
            importance_class="importance--default",
        )

    def _build_metrics(self, briefing: Briefing) -> list[MetricViewModel]:
        sorted_metrics = sorted(briefing.metrics, key=lambda m: m.display_order)
        return [self._format_metric(m) for m in sorted_metrics]

    def _format_metric(self, metric: BriefingMetric) -> MetricViewModel:
        return MetricViewModel(
            label=self._normalise_metric_name(metric.name),
            value=metric.value,
        )

    def _normalise_metric_name(self, raw_name: str) -> str:
        return raw_name.replace("_", " ").title() if "_" in raw_name else raw_name
