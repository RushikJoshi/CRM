const PANEL_TOKENS = {
    SUPER_ADMIN: "superAdminToken",
    COMPANY_ADMIN: "companyToken",
    BRANCH_MANAGER: "branchToken",
    SALES: "salesToken"
};

const getPanelKey = (role) => {
    switch (role) {
        case "super_admin": return PANEL_TOKENS.SUPER_ADMIN;
        case "company_admin": return PANEL_TOKENS.COMPANY_ADMIN;
        case "branch_manager": return PANEL_TOKENS.BRANCH_MANAGER;
        case "sales": return PANEL_TOKENS.SALES;
        default: return null;
    }
};

const getPanelByPath = (path) => {
    if (path.startsWith("/superadmin")) return PANEL_TOKENS.SUPER_ADMIN;
    if (path.startsWith("/company")) return PANEL_TOKENS.COMPANY_ADMIN;
    if (path.startsWith("/branch")) return PANEL_TOKENS.BRANCH_MANAGER;
    if (path.startsWith("/sales")) return PANEL_TOKENS.SALES;
    return null;
};

export const tokenManager = {
    getTokenByRole: (role) => {
        const key = getPanelKey(role);
        return key ? sessionStorage.getItem(key) : null;
    },
    getTokenByPath: (path) => {
        const key = getPanelByPath(path);
        return key ? sessionStorage.getItem(key) : null;
    },
    setToken: (role, token) => {
        const key = getPanelKey(role);
        if (key) sessionStorage.setItem(key, token);
    },
    clearToken: (role) => {
        const key = getPanelKey(role);
        if (key) sessionStorage.removeItem(key);
    },
    clearTokenByPath: (path) => {
        const key = getPanelByPath(path);
        if (key) sessionStorage.removeItem(key);
    }
};

export default tokenManager;
