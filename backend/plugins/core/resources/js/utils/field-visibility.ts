/**
 * Resolve $user.* references to actual user values
 * 
 * @param value - Value that may contain $user.* reference
 * @param user - Current authenticated user object
 * @returns Resolved value
 * 
 * @example
 * resolveUserValue('$user.id', { id: 1, name: 'John' }) // 1
 * resolveUserValue('$user.name', { id: 1, name: 'John' }) // 'John'
 * resolveUserValue('admin', { id: 1, name: 'John' }) // 'admin'
 */
function resolveUserValue(
    value: unknown,
    user: Record<string, unknown> | null | undefined
): unknown {
    if (typeof value !== 'string' || !value.startsWith('$user.')) {
        return value;
    }

    if (!user) {
        return value; // Return original if user not available
    }

    // Extract path after $user.
    const path = value.substring(6); // Remove '$user.' prefix

    // Handle nested paths like $user.roles.name
    const pathParts = path.split('.');
    let current: unknown = user;

    for (const part of pathParts) {
        if (current && typeof current === 'object' && part in current) {
            current = (current as Record<string, unknown>)[part];
        } else {
            return value; // Return original if path not found
        }
    }

    return current;
}

/**
 * Check if a field should be visible based on filter conditions
 * 
 * @param filter - Filter configuration object, e.g., { 'roles': { '_eq': 'admin' } }
 * @param formValues - Current form values from react-hook-form
 * @param user - Current authenticated user object (optional)
 * @returns boolean - true if field should be visible, false otherwise
 * 
 * @example
 * // Show field only when roles equals 'admin'
 * shouldShowField({ 'roles': { '_eq': 'admin' } }, { roles: 'admin' }) // true
 * shouldShowField({ 'roles': { '_eq': 'admin' } }, { roles: 'user' }) // false
 * 
 * @example
 * // Show field when status is in array
 * shouldShowField({ 'status': { '_in': ['active', 'pending'] } }, { status: 'active' }) // true
 * 
 * @example
 * // Show field only when user has specific role
 * shouldShowField({ 'roles': { '_eq': '$user.roles' } }, { roles: ['admin'] }, { roles: ['admin'] }) // true
 * 
 * @example
 * // Show field only when user id matches
 * shouldShowField({ 'user_id': { '_eq': '$user.id' } }, { user_id: 1 }, { id: 1 }) // true
 */
export function shouldShowField(
    filter: Record<string, unknown> | undefined,
    formValues: Record<string, unknown>,
    user?: Record<string, unknown> | null
): boolean {
    // If no filter, always show the field
    if (!filter || typeof filter !== 'object') {
        return true;
    }

    // Check each filter condition
    for (const [fieldName, conditions] of Object.entries(filter)) {
        if (!conditions || typeof conditions !== 'object') {
            continue;
        }

        const fieldValue = formValues[fieldName];
        const conditionObj = conditions as Record<string, unknown>;

        // Handle _eq (equals)
        if ('_eq' in conditionObj) {
            const expectedValue = resolveUserValue(conditionObj._eq, user);
            if (Array.isArray(fieldValue)) {
                // For array fields, check if any value matches
                if (!fieldValue.includes(expectedValue)) {
                    return false;
                }
            } else {
                // For single values, check exact match
                if (fieldValue !== expectedValue) {
                    return false;
                }
            }
        }

        // Handle _neq (not equals)
        if ('_neq' in conditionObj) {
            const notExpectedValue = resolveUserValue(conditionObj._neq, user);
            if (Array.isArray(fieldValue)) {
                if (fieldValue.includes(notExpectedValue)) {
                    return false;
                }
            } else {
                if (fieldValue === notExpectedValue) {
                    return false;
                }
            }
        }

        // Handle _in (value in array)
        if ('_in' in conditionObj) {
            const resolvedIn = resolveUserValue(conditionObj._in, user);
            const expectedValues = Array.isArray(resolvedIn)
                ? resolvedIn
                : [resolvedIn];

            if (Array.isArray(fieldValue)) {
                // For array fields, check if any value is in expected values
                const hasMatch = fieldValue.some(val => expectedValues.includes(val));
                if (!hasMatch) {
                    return false;
                }
            } else {
                // For single values, check if value is in expected array
                if (!expectedValues.includes(fieldValue)) {
                    return false;
                }
            }
        }

        // Handle _not_in (value not in array)
        if ('_not_in' in conditionObj) {
            const resolvedNotIn = resolveUserValue(conditionObj._not_in, user);
            const notExpectedValues = Array.isArray(resolvedNotIn)
                ? resolvedNotIn
                : [resolvedNotIn];

            if (Array.isArray(fieldValue)) {
                const hasMatch = fieldValue.some(val => notExpectedValues.includes(val));
                if (hasMatch) {
                    return false;
                }
            } else {
                if (notExpectedValues.includes(fieldValue)) {
                    return false;
                }
            }
        }

        // Handle _is_null (field is null or undefined)
        if ('_is_null' in conditionObj) {
            const shouldBeNull = conditionObj._is_null === true;
            const isNull = fieldValue === null || fieldValue === undefined || fieldValue === '';

            if (shouldBeNull && !isNull) {
                return false;
            }
            if (!shouldBeNull && isNull) {
                return false;
            }
        }

        // Handle _not_null (field is not null)
        if ('_not_null' in conditionObj) {
            const shouldNotBeNull = conditionObj._not_null === true;
            const isNull = fieldValue === null || fieldValue === undefined || fieldValue === '';

            if (shouldNotBeNull && isNull) {
                return false;
            }
        }

        // Handle _gt (greater than)
        if ('_gt' in conditionObj) {
            const threshold = resolveUserValue(conditionObj._gt, user);
            if (typeof fieldValue === 'number' && typeof threshold === 'number') {
                if (fieldValue <= threshold) {
                    return false;
                }
            }
        }

        // Handle _gte (greater than or equal)
        if ('_gte' in conditionObj) {
            const threshold = resolveUserValue(conditionObj._gte, user);
            if (typeof fieldValue === 'number' && typeof threshold === 'number') {
                if (fieldValue < threshold) {
                    return false;
                }
            }
        }

        // Handle _lt (less than)
        if ('_lt' in conditionObj) {
            const threshold = resolveUserValue(conditionObj._lt, user);
            if (typeof fieldValue === 'number' && typeof threshold === 'number') {
                if (fieldValue >= threshold) {
                    return false;
                }
            }
        }

        // Handle _lte (less than or equal)
        if ('_lte' in conditionObj) {
            const threshold = resolveUserValue(conditionObj._lte, user);
            if (typeof fieldValue === 'number' && typeof threshold === 'number') {
                if (fieldValue > threshold) {
                    return false;
                }
            }
        }
    }

    // All conditions passed
    return true;
}
