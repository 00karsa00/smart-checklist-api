"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
/**
 * Iterates a list of {@link RouteDefinition}s and registers each one on the
 * given router, applying its middlewares in order before the handler.
 */
function registerRoutes(router, routes) {
    for (const { method, path, middlewares = [], handler } of routes) {
        const chain = [...middlewares, handler];
        router[method](path, ...chain);
    }
    return router;
}
//# sourceMappingURL=route-definition.type.js.map