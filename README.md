# WEB_DWH (Node.js + React)

Du an gom 2 phan ro rang:
- `server`: API truy van OLAP Cube (MDX) va tra du lieu drill-down/roll-up.
- `client`: giao dien React de chon measure, drill-down theo member, roll-up ve cap tren.

## 1) Cau truc thu muc

```text
nodejs/
  server/
    src/
      config/
      cube/
      routes/
  client/
    src/
      components/
```

## 2) Cai dat

Tai thu muc `nodejs`:

```bash
npm run install:all
```

## 3) Cau hinh backend

Copy file mau va cap nhat thong so ket noi cube:

```bash
copy server\\.env.example server\\.env
```

Can sua cac bien sau trong `server/.env`:
- `CUBE_SERVER_NAME`
- `CUBE_DATABASE_NAME`
- `CUBE_NAME`
- `CUBE_HIERARCHY`
- `ALLOWED_MEASURES`

## 4) Chay du an

Mo 2 terminal:

Terminal 1:

```bash
npm run dev:server
```

Terminal 2:

```bash
npm run dev:client
```

Truy cap giao dien tai: `http://localhost:5173`

## 5) API backend

Base URL: `http://localhost:4000/api/cube`

- `GET /health`: kiem tra server.
- `GET /meta`: lay hierarchy va measures duoc phep.
- `POST /query`: truy van cube voi body:

```json
{
  "path": ["[Dim Time].[Year].&[2024]"],
  "measures": ["[Measures].[Quantity Ordered]"]
}
```

## 6) Luong drill-down/roll-up

- Khi nguoi dung bam `Drill Down` o mot dong, client them `uniqueName` cua member vao `path` va goi lai API.
- Khi bam `Roll Up`, client bo phan tu cuoi trong `path` de quay lai cap tren.
