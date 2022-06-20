/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

roleFactory.$inject = ['maRestResource'];
function roleFactory(RestResource) {
    
    const baseUrl = '/rest/latest/roles';
    const webSocketUrl = '/rest/latest/websocket/roles';
    const xidPrefix = 'ROLE_';

    class Role extends RestResource {
        static get baseUrl() {
            return baseUrl;
        }

        static get webSocketUrl() {
            return webSocketUrl;
        }

        static get xidPrefix() {
            return xidPrefix;
        }

        static createCache() {
            const cache = super.createCache();
            cache.maxSize = 256;
            return cache;
        }

        static formatRoles(roleXids) {
            const roleCache = this.getCache();
            roleCache.loadItems(roleXids);
            return roleXids.map(xid => {
                const role = roleCache.get(xid);
                return role && role.name;
            }).filter(r => !!r).join(', ');
        }

        formatInheritedRoles() {
            return this.inherited && this.constructor.formatRoles(this.inherited);
        }
    }

    Object.assign(Role.notificationManager, {
        supportsSubscribe: true
    });

    return Role;
}

export default roleFactory;
