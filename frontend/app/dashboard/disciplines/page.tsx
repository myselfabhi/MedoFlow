import { Card, CardContent, CardHeader } from '@/components/ui/Card';

export default function DisciplinesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Disciplines</h1>
        <p className="mt-1 text-sm text-gray-500">Manage disciplines</p>
      </div>
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Disciplines</h2>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
