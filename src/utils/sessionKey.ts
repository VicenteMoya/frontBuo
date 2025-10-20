export function getSessionKey() {
    let k = localStorage.getItem("session_key");
    if (!k) {
        k = crypto.randomUUID(); // o una cadena aleatoria
        localStorage.setItem("session_key", k);
    }
    return k;
}
