import { useState, useEffect } from 'react';
import './App.css';

// Vite proxies /api in development; Nginx proxies it in the Docker image.
const API_URL = '/api/students';

async function requestJson(url, options) {
  const res = await fetch(url, options);
  if (!res.headers.get('content-type')?.includes('application/json')) {
    throw new Error(`API không trả JSON (HTTP ${res.status}). Kiểm tra proxy /api và BACKEND_URL.`);
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `API trả về lỗi ${res.status}`);
  }
  return data;
}

async function getStudents(options) {
  const data = await requestJson(API_URL, options);
  if (!Array.isArray(data)) {
    throw new Error('API danh sách sinh viên phải trả về một mảng JSON.');
  }
  return data;
}

function App() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ studentId: '', name: '', email: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Câu 47: lấy danh sách sinh viên
  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      setStudents(await getStudents());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    getStudents({ signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setStudents(data);
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Câu 49: gửi dữ liệu POST (hoặc PUT nếu đang sửa)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await requestJson(editingId ? `${API_URL}/${editingId}` : API_URL, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setEditingId(null);
      setForm({ studentId: '', name: '', email: '' });
      await fetchStudents();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (student) => {
    setForm({ studentId: student.studentId, name: student.name, email: student.email });
    setEditingId(student._id);
  };

  const handleDelete = async (id) => {
    setSaving(true);
    setError('');
    try {
      await requestJson(`${API_URL}/${id}`, { method: 'DELETE' });
      if (editingId === id) {
        setEditingId(null);
        setForm({ studentId: '', name: '', email: '' });
      }
      await fetchStudents();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>Quản lý sinh viên Nam Cần Thơ</h1>
      <p>Phiên bản 2.0 - Production Cloud PaaS · MSSV: 235304</p>
      {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}
      {loading && <p role="status">Đang tải dữ liệu. Máy chủ Render có thể cần thời gian khởi động.</p>}
      {!loading && !error && students.length === 0 && <p>Chưa có sinh viên trong cơ sở dữ liệu.</p>}
      <button type="button" disabled={loading || saving} onClick={fetchStudents}>Tải lại danh sách</button>

      {/* Câu 48: Form nhập liệu */}
      <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <input
          name="studentId"
          placeholder="MSSV"
          value={form.studentId}
          onChange={handleChange}
          required
        />{' '}
        <input
          name="name"
          placeholder="Họ tên"
          value={form.name}
          onChange={handleChange}
          required
        />{' '}
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />{' '}
        <button type="submit" disabled={saving || loading}>{saving ? 'Đang lưu…' : editingId ? 'Cập nhật' : 'Thêm'}</button>
      </form>

      <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>MSSV</th>
            <th>Họ tên</th>
            <th>Email</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s._id}>
              <td>{s.studentId}</td>
              <td>{s.name}</td>
              <td>{s.email}</td>
              <td>
                <button disabled={saving || loading} onClick={() => handleEdit(s)}>Sửa</button>{' '}
                <button disabled={saving || loading} onClick={() => handleDelete(s._id)}>Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;

