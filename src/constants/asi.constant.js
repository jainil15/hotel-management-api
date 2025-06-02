const ROOM_STATUS_CODE = {
  READY: "Ready",
  IN_HOUSE_CLEAN: "InhouseClean",
  IN_HOUSE_DIRTY: "InhouseDirty",
  VACANT_DIRTY: "VacantDirty",
  CLEAN: "Clean",
  OUT_OF_ORDER: "OutOfOrder",
};

const WEBHOOK_ROOM_STATUS_CODE = {
  VACANT_READY: "VacantReady",
  OCCUPIED_CLEAN: "OccupiedClean",
  OCCUPIED_DIRTY: "OccupiedDirty",
  VACANT_DIRTY: "VacantDirty",
  VACANT_CLEAN: "VacantClean",
  VACANT_MAINTENANCE: "VacantMaintenance",
  RESERVATION_READY: "ReservationReady",
};
module.exports = { ROOM_STATUS_CODE, WEBHOOK_ROOM_STATUS_CODE };
