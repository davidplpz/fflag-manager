# Estrategias de Activación (Flag_Strategy)

El Feature Flags Manager soporta 4 tipos de estrategias de activación. Todas se configuran a través del campo `strategy` al crear o actualizar un flag.

## Resumen

| Tipo | Campo clave | Descripción |
|---|---|---|
| `PERCENTAGE` | `rolloutPercentage` | Activa para un % de usuarios usando hashing consistente por `userId` |
| `USER_LIST` | `userIds`, `isBlacklist` | Whitelist (por defecto) o blacklist de IDs de usuarios |
| `TIME_WINDOW` | `startTime`, `endTime` | Activo solo dentro de un rango de fechas ISO 8601 |
| `COMPOSITE` | `operator`, `strategies` | Combina múltiples estrategias con lógica `AND` / `OR` |

---

## 1. PERCENTAGE — Rollout gradual por porcentaje

Habilita el flag para un porcentaje concreto de usuarios. El algoritmo usa **hashing consistente SHA-256** sobre el `userId`, garantizando que el mismo usuario siempre obtiene el mismo resultado.

```json
{
  "key": "new-checkout-flow",
  "name": "New Checkout Flow",
  "description": "Nuevo flujo de compra — rollout al 25%",
  "enabled": true,
  "strategy": {
    "type": "PERCENTAGE",
    "rolloutPercentage": 25
  }
}
```

**Cómo funciona:**
```
hash = SHA-256(userId)
bucket = parseInt(hash.substring(0, 8), 16) % 100
enabled = bucket < rolloutPercentage
```

**Casos de uso:**
- Canary releases y A/B testing
- Rollout gradual (5% → 25% → 50% → 100%)
- Medir impacto antes de lanzamiento completo

---

## 2. USER_LIST — Whitelist o Blacklist de usuarios

### Whitelist (por defecto)
Habilita el flag **solo para los usuarios de la lista**.

```json
{
  "key": "beta-dashboard",
  "name": "Beta Dashboard",
  "description": "Panel de control beta para usuarios seleccionados",
  "enabled": true,
  "strategy": {
    "type": "USER_LIST",
    "userIds": ["user-123", "user-456", "user-789"],
    "isBlacklist": false
  }
}
```

### Blacklist
Habilita el flag para **todos excepto los usuarios de la lista**.

```json
{
  "key": "premium-feature",
  "name": "Premium Feature",
  "description": "Disponible para todos excepto usuarios en prueba gratuita",
  "enabled": true,
  "strategy": {
    "type": "USER_LIST",
    "userIds": ["trial-user-001", "trial-user-002"],
    "isBlacklist": true
  }
}
```

**Evaluación:**
```
// Whitelist: enabled = userIds.includes(userId)
// Blacklist: enabled = !userIds.includes(userId)
```

---

## 3. TIME_WINDOW — Activación por ventana de tiempo

Activa el flag solo durante un rango de fechas concreto. Útil para lanzamientos programados, eventos especiales o promotions.

```json
{
  "key": "black-friday-sale",
  "name": "Black Friday Sale Banner",
  "description": "Banner de Black Friday activo solo durante el evento",
  "enabled": true,
  "strategy": {
    "type": "TIME_WINDOW",
    "startTime": "2026-11-27T00:00:00.000Z",
    "endTime": "2026-11-30T23:59:59.999Z"
  }
}
```

**Reglas de validación:**
- `startTime` y `endTime` deben estar en formato **ISO 8601**
- `endTime` debe ser posterior a `startTime`
- La evaluación usa la hora UTC del servidor

**Evaluación:**
```
const now = new Date();
enabled = now >= new Date(startTime) && now <= new Date(endTime);
```

---

## 4. COMPOSITE — Combinación de estrategias

Permite combinar múltiples estrategias con operadores lógicos `AND` u `OR`.

### AND — Todas las condiciones deben cumplirse

```json
{
  "key": "vip-beta-feature",
  "name": "VIP Beta Feature",
  "description": "Feature para usuarios VIP durante el periodo beta (ambas condiciones)",
  "enabled": true,
  "strategy": {
    "type": "COMPOSITE",
    "operator": "AND",
    "strategies": [
      {
        "type": "USER_LIST",
        "userIds": ["vip-001", "vip-002", "vip-003"],
        "isBlacklist": false
      },
      {
        "type": "TIME_WINDOW",
        "startTime": "2026-03-01T00:00:00.000Z",
        "endTime": "2026-03-31T23:59:59.999Z"
      }
    ]
  }
}
```

### OR — Al menos una condición debe cumplirse

```json
{
  "key": "early-access",
  "name": "Early Access",
  "description": "Para usuarios beta O usuarios en el 10% inicial del rollout",
  "enabled": true,
  "strategy": {
    "type": "COMPOSITE",
    "operator": "OR",
    "strategies": [
      {
        "type": "USER_LIST",
        "userIds": ["beta-tester-001", "beta-tester-002"]
      },
      {
        "type": "PERCENTAGE",
        "rolloutPercentage": 10
      }
    ]
  }
}
```

---

## Evaluación de un flag con contexto de usuario

Al llamar a `POST /api/feature-flags/:key/evaluate`, proporciona el `userId` y atributos adicionales:

```json
{
  "userId": "user-123",
  "attributes": {
    "plan": "premium",
    "country": "ES",
    "deviceType": "mobile"
  }
}
```

**Respuesta:**
```json
{ "enabled": true }
```

> **Nota:** Si el flag no existe o ocurre cualquier error, la respuesta siempre es `{ "enabled": false }` (comportamiento fail-safe).
