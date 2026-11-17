// OmniPlan stores task dates as local midnight in the user's browser, so the
// server must use the same time zone when reading and writing dates.
// Node applies process.env.TZ changes at runtime; this module is imported first.
process.env.TZ = process.env.OMNIPLAN_TZ || 'Europe/Kyiv';

export const TIME_ZONE = process.env.TZ;
