import { useState } from 'react';
import { Bell, Lock, User, Library } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Switch } from '../ui/switch';
import { toast } from 'sonner';

export function Settings() {
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: false,
    autoApprove: false,
    borrowDays: {
      giaoTrinh: 30,
      sachThamKhao: 21,
      sachHot: 7,
      truyen: 7,
      taiLieuDacBiet: 3,
    },
    penaltyPerDay: 10000,
  });

  const handleSave = () => {
    toast.success('Đã lưu cài đặt thành công!');
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Cài đặt</h1>
        <p className="mt-1 text-gray-600">Quản lý cấu hình hệ thống</p>
      </div>

      <div className="space-y-6">
        {/* Borrowing Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Library className="h-5 w-5" />
              <CardTitle>Cấu hình mượn sách</CardTitle>
            </div>
            <CardDescription>Thiết lập số ngày mượn theo từng loại sách</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="giaoTrinh">Giáo trình (ngày)</Label>
                <Input
                  id="giaoTrinh"
                  type="number"
                  value={settings.borrowDays.giaoTrinh}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    borrowDays: { ...settings.borrowDays, giaoTrinh: Number(e.target.value) }
                  })}
                  className="mt-2"
                />
                <p className="mt-1 text-xs text-gray-500">Khuyến nghị: 14-30 ngày</p>
              </div>
              <div>
                <Label htmlFor="sachThamKhao">Sách tham khảo (ngày)</Label>
                <Input
                  id="sachThamKhao"
                  type="number"
                  value={settings.borrowDays.sachThamKhao}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    borrowDays: { ...settings.borrowDays, sachThamKhao: Number(e.target.value) }
                  })}
                  className="mt-2"
                />
                <p className="mt-1 text-xs text-gray-500">Khuyến nghị: 14-30 ngày</p>
              </div>
              <div>
                <Label htmlFor="sachHot">Sách hot/Mới (ngày)</Label>
                <Input
                  id="sachHot"
                  type="number"
                  value={settings.borrowDays.sachHot}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    borrowDays: { ...settings.borrowDays, sachHot: Number(e.target.value) }
                  })}
                  className="mt-2"
                />
                <p className="mt-1 text-xs text-gray-500">Khuyến nghị: 7 ngày</p>
              </div>
              <div>
                <Label htmlFor="truyen">Truyện (ngày)</Label>
                <Input
                  id="truyen"
                  type="number"
                  value={settings.borrowDays.truyen}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    borrowDays: { ...settings.borrowDays, truyen: Number(e.target.value) }
                  })}
                  className="mt-2"
                />
                <p className="mt-1 text-xs text-gray-500">Khuyến nghị: 7 ngày</p>
              </div>
              <div>
                <Label htmlFor="taiLieuDacBiet">Tài liệu đặc biệt (ngày)</Label>
                <Input
                  id="taiLieuDacBiet"
                  type="number"
                  value={settings.borrowDays.taiLieuDacBiet}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    borrowDays: { ...settings.borrowDays, taiLieuDacBiet: Number(e.target.value) }
                  })}
                  className="mt-2"
                />
                <p className="mt-1 text-xs text-gray-500">Mượn theo ngày hoặc tại chỗ</p>
              </div>
              <div>
                <Label htmlFor="penaltyPerDay">Phí phạt mỗi ngày (VNĐ)</Label>
                <Input
                  id="penaltyPerDay"
                  type="number"
                  value={settings.penaltyPerDay}
                  onChange={(e) => setSettings({ ...settings, penaltyPerDay: Number(e.target.value) })}
                  className="mt-2"
                />
                <p className="mt-1 text-xs text-gray-500">Phí phạt khi trả sách quá hạn</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Thông báo</CardTitle>
            </div>
            <CardDescription>Quản lý cài đặt thông báo hệ thống</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Bật thông báo</p>
                <p className="text-sm text-gray-600">Nhận thông báo về hoạt động hệ thống</p>
              </div>
              <Switch
                checked={settings.notifications}
                onCheckedChange={(checked) => setSettings({ ...settings, notifications: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Gửi email thông báo</p>
                <p className="text-sm text-gray-600">Gửi email khi có sách quá hạn</p>
              </div>
              <Switch
                checked={settings.emailAlerts}
                onCheckedChange={(checked) => setSettings({ ...settings, emailAlerts: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Auto Approve Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>Quy trình mượn sách</CardTitle>
            </div>
            <CardDescription>Cấu hình quy trình duyệt yêu cầu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Tự động duyệt yêu cầu</p>
                <p className="text-sm text-gray-600">Tự động duyệt yêu cầu mượn sách mới</p>
              </div>
              <Switch
                checked={settings.autoApprove}
                onCheckedChange={(checked) => setSettings({ ...settings, autoApprove: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            Lưu cài đặt
          </Button>
        </div>
      </div>
    </div>
  );
}