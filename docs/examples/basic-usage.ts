/**
 * Feature Flags Manager - Ejemplos de uso comunes
 *
 * Este archivo muestra cómo interactuar con la API REST del Feature Flags Manager
 * usando fetch nativo de Node.js 18+ o cualquier cliente HTTP.
 *
 * Prerrequisitos:
 *   - API corriendo en http://localhost:3000
 *   - Token JWT válido (rol admin o viewer según el caso)
 */

const API_BASE = 'http://localhost:3000/api';

// Sustituye con tu token JWT real
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${JWT_TOKEN}`,
};

// ---------------------------------------------------------------------------
// 1. CREAR un feature flag simple (rol: admin)
// ---------------------------------------------------------------------------
async function createSimpleFlag() {
    const response = await fetch(`${API_BASE}/feature-flags`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            key: 'my-new-feature',
            name: 'My New Feature',
            description: 'Habilita la nueva interfaz de usuario',
            enabled: false,
        }),
    });

    if (!response.ok) throw new Error(`Error: ${response.status}`);
    const flag = await response.json();
    console.log('Flag creado:', flag);
    return flag;
}

// ---------------------------------------------------------------------------
// 2. LISTAR todos los flags con paginación (rol: admin o viewer)
// ---------------------------------------------------------------------------
async function listFlags(page = 1, limit = 10) {
    const url = new URL(`${API_BASE}/feature-flags`);
    url.searchParams.set('page', String(page));
    url.searchParams.set('limit', String(limit));

    const response = await fetch(url.toString(), { headers });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    const result = await response.json();
    console.log(`Flags (página ${page}):`, result);
    return result;
}

// ---------------------------------------------------------------------------
// 3. EVALUAR un flag con User_Context (rol: admin o viewer)
// ---------------------------------------------------------------------------
async function evaluateFlag(flagKey: string, userId: string) {
    const response = await fetch(`${API_BASE}/feature-flags/${flagKey}/evaluate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            userId,
            attributes: { plan: 'premium', country: 'ES' },
        }),
    });

    if (!response.ok) throw new Error(`Error: ${response.status}`);
    const result = await response.json() as { enabled: boolean };
    console.log(`Flag "${flagKey}" para user "${userId}":`, result.enabled);
    return result.enabled;
}

// ---------------------------------------------------------------------------
// 4. ACTUALIZAR un flag para habilitar una estrategia por porcentaje (rol: admin)
// ---------------------------------------------------------------------------
async function enableWithPercentageStrategy(flagKey: string, percentage: number) {
    const response = await fetch(`${API_BASE}/feature-flags/${flagKey}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
            enabled: true,
            strategy: {
                type: 'PERCENTAGE',
                rolloutPercentage: percentage,
            },
        }),
    });

    if (!response.ok) throw new Error(`Error: ${response.status}`);
    const updated = await response.json();
    console.log(`Flag "${flagKey}" actualizado con ${percentage}% rollout:`, updated);
    return updated;
}

// ---------------------------------------------------------------------------
// 5. OBTENER MÉTRICAS de un flag en la última hora (rol: admin o viewer)
// ---------------------------------------------------------------------------
async function getFlagMetrics(flagKey: string, window: '1h' | '24h' | '7d' | '30d' = '24h') {
    const url = new URL(`${API_BASE}/feature-flags/${flagKey}/metrics`);
    url.searchParams.set('window', window);

    const response = await fetch(url.toString(), { headers });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    const metrics = await response.json();
    console.log(`Métricas de "${flagKey}" (${window}):`, metrics);
    /*
    Ejemplo de respuesta:
    {
      flagKey: 'my-new-feature',
      totalEvaluations: 1250,
      enabledCount: 312,
      disabledCount: 938,
      uniqueUsers: 87,
      successRate: 0.25
    }
    */
    return metrics;
}

// ---------------------------------------------------------------------------
// 6. OBTENER ANALYTICS con time-series (rol: admin o viewer)
// ---------------------------------------------------------------------------
async function getFlagAnalytics(flagKey: string, window: '1h' | '24h' | '7d' | '30d' = '7d') {
    const url = new URL(`${API_BASE}/feature-flags/${flagKey}/analytics`);
    url.searchParams.set('window', window);

    const response = await fetch(url.toString(), { headers });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    const analytics = await response.json();
    console.log(`Analytics de "${flagKey}" (${window}):`, analytics);
    /*
    Ejemplo de respuesta:
    {
      flagKey: 'my-new-feature',
      timeWindow: '7d',
      totalEvaluations: 8750,
      uniqueUsers: 342,
      enabledRatio: 0.25,
      trend: 'increasing',
      dataPoints: [
        { timestamp: '2026-03-05T00:00:00Z', evaluations: 1200, uniqueUsers: 45 },
        { timestamp: '2026-03-06T00:00:00Z', evaluations: 1350, uniqueUsers: 52 },
        ...
      ]
    }
    */
    return analytics;
}

// ---------------------------------------------------------------------------
// 7. ELIMINAR un flag (rol: admin)
// ---------------------------------------------------------------------------
async function deleteFlag(flagKey: string) {
    const response = await fetch(`${API_BASE}/feature-flags/${flagKey}`, {
        method: 'DELETE',
        headers,
    });

    if (response.status !== 204) throw new Error(`Error: ${response.status}`);
    console.log(`Flag "${flagKey}" eliminado correctamente`);
}

// ---------------------------------------------------------------------------
// 8. COMPROBAR salud del sistema (sin auth)
// ---------------------------------------------------------------------------
async function checkHealth() {
    const response = await fetch(`${API_BASE}/health`);
    const health = await response.json();
    console.log('Estado del sistema:', health);
    /*
    Ejemplo de respuesta saludable:
    {
      status: 'ok',
      services: {
        database: { status: 'up' },
        redis: { status: 'up' }
      }
    }
    */
    return health;
}

// ---------------------------------------------------------------------------
// Ejecutar ejemplos
// ---------------------------------------------------------------------------
(async () => {
    try {
        await checkHealth();
        await createSimpleFlag();
        await listFlags();
        await evaluateFlag('my-new-feature', 'user-123');
        await enableWithPercentageStrategy('my-new-feature', 25);
        await getFlagMetrics('my-new-feature', '24h');
        await getFlagAnalytics('my-new-feature', '7d');
        await deleteFlag('my-new-feature');
    } catch (error) {
        console.error('Error en los ejemplos:', error);
    }
})();
