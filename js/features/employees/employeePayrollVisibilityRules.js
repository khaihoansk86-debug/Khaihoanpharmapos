export function canViewAllEmployeePayroll(viewer = null) {
    return String(viewer?.role || '').trim().toLowerCase() === 'admin';
}

export function filterPayrollEmployeesForViewer(
    employees = [],
    viewer = null
) {
    const rows = Array.isArray(employees) ? employees : [];
    if (canViewAllEmployeePayroll(viewer)) return [...rows];

    const viewerId = String(viewer?.id || '').trim();
    if (!viewerId) return [];
    return rows.filter(employee => String(employee?.id || '') === viewerId);
}

export function mergeEmployeeDirectoryWithProfiles(
    directory = [],
    profiles = []
) {
    const profileById = new Map(
        (Array.isArray(profiles) ? profiles : [])
            .map(profile => [String(profile?.id || ''), profile])
    );
    return (Array.isArray(directory) ? directory : []).map(entry => ({
        ...entry,
        ...(profileById.get(String(entry?.id || '')) || {})
    }));
}
