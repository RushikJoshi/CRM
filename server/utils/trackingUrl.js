const LOCAL_HOST_PATTERNS = ["localhost", "127.0.0.1", "::1"];

const normalizeApiBase = (value) => {
  if (!value) return "";
  const trimmed = String(value).trim().replace(/\/$/, "");
  if (!trimmed) return "";
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
};

const getTrackingBaseUrl = () => {
  return normalizeApiBase(
    process.env.TRACKING_BASE_URL ||
    process.env.PUBLIC_API_BASE_URL ||
    process.env.API_BASE_URL ||
    process.env.BASE_URL
  );
};

const isLocalTrackingBaseUrl = (value = getTrackingBaseUrl()) => {
  if (!value) return true;
  return LOCAL_HOST_PATTERNS.some((pattern) => value.includes(pattern));
};

module.exports = {
  getTrackingBaseUrl,
  isLocalTrackingBaseUrl,
};
