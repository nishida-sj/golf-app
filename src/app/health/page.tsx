export default function HealthPage() {
  return (
    <div>
      <h1>Health Check</h1>
      <p>App is running</p>
      <p>Time: {new Date().toISOString()}</p>
    </div>
  );
}