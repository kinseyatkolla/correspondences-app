const { buildChart } = require("./chartBuilder");

function validateBirthBody(body) {
  const {
    year,
    month,
    day,
    hour = 12,
    minute = 0,
    second = 0,
    latitude,
    longitude,
  } = body;
  if (
    year == null ||
    month == null ||
    day == null ||
    latitude == null ||
    longitude == null
  ) {
    return { ok: false, error: "Missing year, month, day, latitude, or longitude" };
  }
  return {
    ok: true,
    data: {
      year: Number(year),
      month: Number(month),
      day: Number(day),
      hour: Number(hour),
      minute: Number(minute ?? 0),
      second: Number(second ?? 0),
      latitude: Number(latitude),
      longitude: Number(longitude),
    },
  };
}

function chartFromBirthBody(body) {
  const validated = validateBirthBody(body);
  if (!validated.ok) throw new Error(validated.error);
  const d = validated.data;
  return buildChart(d.latitude, d.longitude, d);
}

function birthMsFromBody(body) {
  const validated = validateBirthBody(body);
  if (!validated.ok) throw new Error(validated.error);
  const d = validated.data;
  return Date.UTC(d.year, d.month - 1, d.day, d.hour, d.minute, d.second);
}

module.exports = {
  validateBirthBody,
  chartFromBirthBody,
  birthMsFromBody,
};
