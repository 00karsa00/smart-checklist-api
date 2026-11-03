export const logger = {
  info(message: string, meta?: unknown) {
    console.log(
      JSON.stringify({
        level: "info",
        timestamp: new Date().toISOString(),
        message,
        meta,
      }),
    );
  },

  warn(message: string, meta?: unknown) {
    console.warn(
      JSON.stringify({
        level: "warn",
        timestamp: new Date().toISOString(),
        message,
        meta,
      }),
    );
  },

  error(message: string, meta?: unknown) {
    console.error(
      JSON.stringify({
        level: "error",
        timestamp: new Date().toISOString(),
        message,
        meta,
      }),
    );
  },
};
