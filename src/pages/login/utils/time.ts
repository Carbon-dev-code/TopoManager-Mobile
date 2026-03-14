export function sessionDuration(): string {
    const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
    return (new Date().getTime() + SESSION_DURATION).toString();
}