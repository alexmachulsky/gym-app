from pydantic import BaseModel, ConfigDict


class CheckoutRequest(BaseModel):
    plan: str  # pro_monthly | pro_yearly
    promotion_code: str | None = None


class CheckoutResponse(BaseModel):
    checkout_url: str


class PortalResponse(BaseModel):
    portal_url: str


class BillingStatusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    subscription_tier: str
    plan: str | None = None
    status: str | None = None
    current_period_end: str | None = None
    cancel_at_period_end: bool = False


class BillingConfigResponse(BaseModel):
    publishable_key: str
    pro_monthly_price_id: str
    pro_yearly_price_id: str
