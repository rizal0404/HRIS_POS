# HR Management Dashboard (Supabase Version)

This document provides a comprehensive guide to setting up, building, and deploying the HR Management Dashboard application for a production environment.

## 1. Project Overview

The HR Management Dashboard is a web application designed to streamline human resources operations. It allows employees to manage their work schedules, submit requests for leave and overtime, and correct their attendance records. Supervisors and managers can review and approve these requests, while administrators can manage employee data and system configurations.

**Core Features:**
- User authentication and role-based access control (Pegawai, Manager, Admin, SuperAdmin).
- Clock-in/Clock-out functionality with geolocation.
- Submission and approval workflows for leave, overtime, and shift substitution.
- Team and individual shift schedule management.
- Employee data management.
- System configuration for shifts, departments, etc.
- Reporting and data export capabilities.

## 2. Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend-as-a-Service (BaaS)**: [Supabase](https://supabase.com/)
  - **Database**: Supabase PostgreSQL
  - **Authentication**: Supabase Auth
  - **Storage**: Supabase Storage
- **Mapping**: Leaflet & React-Leaflet
- **PDF Generation**: jsPDF, html2canvas

## 3. Project Structure

The application is structured as a standard React project.

```
/
├── public/                 # Public assets
├── src/
│   ├── components/         # Reusable React components (Modals, Icons, etc.)
│   ├── pages/              # Top-level page components for different views
│   │   ├── admin/          # Components specific to the Admin/Manager dashboard tabs
│   │   └── pegawai/        # Components specific to the Employee dashboard tabs
│   ├── services/           # API services, Supabase client, and mock data
│   ├── App.tsx             # Main application component with routing logic
│   ├── index.tsx           # Entry point for the React application
│   └── types.ts            # TypeScript type definitions for the application
├── index.html              # Main HTML file
├── metadata.json           # Application metadata and permissions
└── README.md               # This documentation file
```

## 4. Backend Setup (Supabase)

Follow these steps to configure your Supabase backend.

### 4.1. Create Supabase Project

1.  Go to [supabase.com](https://supabase.com/) and create a new project.
2.  Choose a strong database password and save it securely.
3.  Select a region that is geographically close to your users for lower latency.

### 4.2. Get API Credentials

1.  In your Supabase project dashboard, navigate to **Project Settings** (the gear icon).
2.  Go to the **API** section.
3.  You will find your **Project URL** and the `anon` **public** key. These will be used in the frontend setup.

### 4.3. Database Schema Setup

Navigate to the **SQL Editor** in your Supabase dashboard and run the following SQL scripts to create the necessary tables, relationships, and policies.

#### Enable Row Level Security (RLS)

First, enable RLS on all tables. This is a critical security step. Policies will be added for each table to grant specific access.

```sql
-- Run this for each table created below
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;
```

#### Table Schemas

Run these `CREATE TABLE` statements in the SQL Editor.

<details>
<summary><strong>SQL for `user_profiles` Table</strong></summary>

```sql
-- Stores user profile information, extending the auth.users table.
CREATE TABLE public.user_profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email character varying NOT NULL UNIQUE,
    name character varying NOT NULL,
    role character varying NOT NULL,
    nik character varying NOT NULL UNIQUE,
    posisi character varying,
    seksi character varying,
    unit_kerja character varying,
    shift_kerja character varying,
    no_hp character varying,
    alamat text,
    total_cuti_tahunan integer DEFAULT 12 NOT NULL,
    manager_id uuid REFERENCES public.user_profiles(id)
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Allow users to view their own profile"
ON public.user_profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Allow users to update their own contact info"
ON public.user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow admins and managers to view all profiles"
ON public.user_profiles FOR SELECT
TO authenticated
USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('Admin', 'SuperAdmin', 'Manager'));

CREATE POLICY "Allow admins to manage all profiles"
ON public.user_profiles FOR ALL
TO authenticated
USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('Admin', 'SuperAdmin'));
```
</details>

<details>
<summary><strong>SQL for `user_device_fingerprints` Table</strong></summary>

```sql
-- Stores device fingerprints. Each fingerprint must be unique and is associated with one user. A user can have multiple fingerprints.
CREATE TABLE public.user_device_fingerprints (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    fingerprint_id text NOT NULL UNIQUE,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.user_device_fingerprints ENABLE ROW LEVEL SECURITY;

-- Policies for user_device_fingerprints
CREATE POLICY "Allow users to manage their own fingerprint"
ON public.user_device_fingerprints FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow admins to view all fingerprints"
ON public.user_device_fingerprints FOR SELECT
TO authenticated
USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('Admin', 'SuperAdmin'));

CREATE POLICY "Allow managers and admins to delete fingerprints"
ON public.user_device_fingerprints FOR DELETE
TO authenticated
USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('Manager', 'Admin', 'SuperAdmin'));
```
</details>

<details>
<summary><strong>SQL for `jadwal_kerja` and `presensi` Tables</strong></summary>

```sql
-- Stores work schedules for each employee.
CREATE TABLE public.jadwal_kerja (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    tanggal date NOT NULL,
    nik character varying NOT NULL,
    nama character varying NOT NULL,
    seksi character varying,
    shift character varying NOT NULL,
    UNIQUE (nik, tanggal)
);

-- Stores attendance records (clock-in/out).
CREATE TABLE public.presensi (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    nik character varying NOT NULL,
    nama character varying,
    tanggal date NOT NULL,
    shift character varying,
    clock_in_timestamp timestamp with time zone,
    clock_in_health_status character varying,
    clock_in_work_location_type character varying,
    clock_in_workplace character varying,
    clock_in_notes text,
    clock_in_latitude double precision,
    clock_in_longitude double precision,
    clock_out_timestamp timestamp with time zone,
    clock_out_health_status character varying,
    clock_out_work_location_type character varying,
    clock_out_workplace character varying,
    clock_out_notes text,
    clock_out_latitude double precision,
    clock_out_longitude double precision,
    total_hours double precision,
    UNIQUE (nik, tanggal)
);

-- Enable RLS
ALTER TABLE public.jadwal_kerja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presensi ENABLE ROW LEVEL SECURITY;

-- Policies for jadwal_kerja & presensi
CREATE POLICY "Allow users to view their own records"
ON public.jadwal_kerja FOR SELECT
TO authenticated
USING (nik = (SELECT nik FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Allow users to manage their own presensi records"
ON public.presensi FOR ALL
TO authenticated
USING (nik = (SELECT nik FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Allow admins/managers to view all records"
ON public.jadwal_kerja FOR SELECT
TO authenticated
USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('Admin', 'SuperAdmin', 'Manager'));

CREATE POLICY "Allow admins/managers to manage all records"
ON public.presensi FOR ALL
TO authenticated
USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('Admin', 'SuperAdmin', 'Manager'));

CREATE POLICY "Allow admins to manage all schedules"
ON public.jadwal_kerja FOR ALL
TO authenticated
USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('Admin', 'SuperAdmin'));
```
</details>

<details>
<summary><strong>SQL for `usulan_*` Tables (Proposals)</strong></summary>

```sql
-- Base policies that can be adapted for all proposal tables
-- CREATE POLICY "Allow users to insert their own requests"
-- ON public.usulan_table FOR INSERT
-- TO authenticated
-- WITH CHECK (nik = (SELECT nik FROM public.user_profiles WHERE id = auth.uid()));
--
-- CREATE POLICY "Allow users to view/delete their own pending requests"
-- ON public.usulan_table FOR SELECT, DELETE
-- TO authenticated
-- USING (nik = (SELECT nik FROM public.user_profiles WHERE id = auth.uid()));
--
-- CREATE POLICY "Allow managers/admins to manage all requests"
-- ON public.usulan_table FOR ALL
-- TO authenticated
-- USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('Manager', 'Admin', 'SuperAdmin'));

-- usulan_cuti
CREATE TABLE public.usulan_cuti (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    nik character varying NOT NULL,
    nama character varying NOT NULL,
    seksi character varying,
    status character varying DEFAULT 'Diajukan'::character varying NOT NULL,
    catatan_admin text,
    role_pengaju character varying NOT NULL,
    manager_id uuid REFERENCES public.user_profiles(id),
    jenis_ajuan character varying NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    keterangan text,
    link_berkas text,
    pengganti_nik character varying[]
);

-- usulan_lembur
CREATE TABLE public.usulan_lembur (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    nik character varying NOT NULL,
    nama character varying NOT NULL,
    seksi character varying,
    status character varying DEFAULT 'Diajukan'::character varying NOT NULL,
    catatan_admin text,
    role_pengaju character varying NOT NULL,
    manager_id uuid REFERENCES public.user_profiles(id),
    jenis_ajuan character varying NOT NULL,
    tanggal_lembur date NOT NULL,
    shift character varying NOT NULL,
    jam_awal time without time zone NOT NULL,
    jam_akhir time without time zone NOT NULL,
    tanpa_istirahat character varying[],
    kategori_lembur character varying,
    keterangan_lembur text,
    jam_lembur double precision
);

-- usulan_substitusi
CREATE TABLE public.usulan_substitusi (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    nik character varying NOT NULL,
    nama character varying NOT NULL,
    seksi character varying,
    status character varying DEFAULT 'Diajukan'::character varying NOT NULL,
    catatan_admin text,
    role_pengaju character varying NOT NULL,
    manager_id uuid REFERENCES public.user_profiles(id),
    jenis_ajuan character varying NOT NULL,
    tanggal_substitusi date NOT NULL,
    shift_awal character varying NOT NULL,
    shift_baru character varying NOT NULL,
    keterangan text
);

-- usulan_pembetulan_presensi (schema from application code)
CREATE TABLE public.usulan_pembetulan_presensi (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    nik character varying NOT NULL,
    nama character varying NOT NULL,
    seksi character varying,
    status character varying DEFAULT 'Diajukan'::character varying NOT NULL,
    catatan_admin text,
    role_pengaju character varying NOT NULL,
    manager_id uuid REFERENCES public.user_profiles(id),
    jenis_ajuan character varying DEFAULT 'Pembetulan Presensi'::character varying NOT NULL,
    presensi_id character varying,
    tanggal_pembetulan date NOT NULL,
    jam_pembetulan time without time zone NOT NULL,
    clock_type character varying NOT NULL,
    alasan text,
    link_bukti text
);

-- Add RLS and policies to all `usulan_*` tables using the templates above.
```
</details>

<details>
<summary><strong>SQL for Configuration Tables</strong></summary>

```sql
-- Stores master data for departments/sections.
CREATE TABLE public.seksi (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    name character varying NOT NULL UNIQUE
);

-- Stores master data for work units.
CREATE TABLE public.unit_kerja (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    name character varying NOT NULL UNIQUE
);

-- Stores shift definitions.
CREATE TABLE public.shift_configs (
    id character varying NOT NULL PRIMARY KEY,
    code character varying NOT NULL UNIQUE,
    name character varying NOT NULL,
    "time" character varying,
    color character varying NOT NULL,
    "group" character varying NOT NULL
);

-- Stores vendor information for reports.
CREATE TABLE public.vendor_configs (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    nama_vendor character varying NOT NULL,
    nama_admin character varying NOT NULL
);

-- Stores master leave quotas.
CREATE TABLE public.quota_cuti (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    nik character varying NOT NULL,
    nama_karyawan character varying NOT NULL,
    jenis_cuti character varying NOT NULL,
    periode character varying,
    masa_berlaku_start date NOT NULL,
    masa_berlaku_end date NOT NULL,
    quota integer NOT NULL
);

-- Enable RLS for all config tables
ALTER TABLE public.seksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_kerja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quota_cuti ENABLE ROW LEVEL SECURITY;


-- Policies for config tables (read for all, write for admins)
CREATE POLICY "Allow authenticated read access"
ON public.seksi FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated read access"
ON public.unit_kerja FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated read access"
ON public.shift_configs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated read access"
ON public.vendor_configs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow users to read their own quotas"
ON public.quota_cuti FOR SELECT
TO authenticated
USING (nik = (SELECT nik FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Allow admins to manage all config tables"
ON public.seksi FOR ALL
TO authenticated
USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('Admin', 'SuperAdmin'));

-- (Repeat the admin policy for unit_kerja, shift_configs, vendor_configs, and quota_cuti)
```
</details>


### 4.4. Authentication Setup

1.  In the Supabase dashboard, go to **Authentication**.
2.  Under the **Providers** section, ensure the **Email** provider is enabled.
3.  (Optional) Customize the email templates for confirmation, password reset, etc., under the **Templates** section.
4.  Disable the "Confirm email" setting if you want users to be able to log in immediately after being created by an admin.

### 4.5. Storage Setup

The application uses Supabase Storage to upload proof files for leave requests.

1.  In the Supabase dashboard, go to **Storage**.
2.  Click **"New bucket"**.
3.  Enter the bucket name: `bukti_izin`.
4.  Toggle **"Public bucket"** to ON.
5.  Click **"Create bucket"**.
6.  After creation, navigate to the **Policies** for the new bucket.
7.  Create the following policies for the `storage.objects` table:

    <details>
    <summary><strong>Policy 1: Allow authenticated uploads</strong></summary>

    -   **Policy Name**: `Allow authenticated uploads`
    -   **Allowed operation**: `INSERT`
    -   **Target roles**: `authenticated`
    -   **WITH CHECK expression**: `bucket_id = 'bukti_izin'`
    </details>

    <details>
    <summary><strong>Policy 2: Allow users to view their own files</strong></summary>

    -   **Policy Name**: `Allow users to view their own files`
    -   **Allowed operation**: `SELECT`
    -   **Target roles**: `authenticated`
    -   **USING expression**: `bucket_id = 'bukti_izin' AND auth.uid() = owner`
    </details>

## 5. Frontend Setup

### 5.1. Prerequisites

-   [Node.js](https://nodejs.org/) (LTS version recommended)
-   A package manager like `npm` or `yarn`.

### 5.2. Environment Variables

The application does not use a `.env` file. The Supabase credentials are hardcoded directly into `src/services/supabase.ts`.

**For production, it is strongly recommended to use environment variables.**

1.  Modify `src/services/supabase.ts`:

    ```typescript
    // src/services/supabase.ts

    import { createClient } from '@supabase/supabase-js';

    // Replace hardcoded values with environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase URL and Anon Key must be provided in environment variables.");
    }

    export const supabase = createClient(supabaseUrl, supabaseKey);
    ```

2.  Your deployment platform (e.g., Vercel, Netlify) will have a section to set these environment variables.

    -   `SUPABASE_URL`: Your Supabase Project URL.
    -   `SUPABASE_ANON_KEY`: Your Supabase `anon` public key.

### 5.3. Installation & Running

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```

## 6. Build & Deployment

### 6.1. Build Command

To create a production-ready build of the application, run:

```bash
npm run build
```

This will generate a `dist` directory containing optimized, static assets for your application.

### 6.2. Deployment

You can deploy the contents of the `dist` directory to any static hosting provider, such as:

-   Vercel
-   Netlify
-   Firebase Hosting
-   GitHub Pages

During the setup process on your chosen platform, ensure you configure the environment variables (`SUPABASE_URL` and `SUPABASE_ANON_KEY`) as described in section 5.2.

## 7. Initial Data Population

1.  **Create Admin User**: After deploying the application, the first step is to create an administrative user. You can do this directly in the Supabase dashboard:
    -   Go to **Authentication** -> **Users**.
    -   Click **"Add user"** and create your first user.
    -   Go to the **Database** -> **`user_profiles`** table and manually edit the new user's row. Set their `role` to `SuperAdmin` and fill in the other required details (`nik`, `name`, etc.).

2.  **Manage Data via UI**: Once logged in as a `SuperAdmin`, you can populate the rest of the required data through the application's user interface:
    -   **Add Employees**: Use the "Data Pegawai" tab to add new employees and managers. This will create their login credentials and profiles.
    -   **Configure Shifts**: Use the "Konfigurasi Shift" tab to define all possible work shifts.
    -   **Configure Master Data**: Use the "Data Seksi", "Data Unit Kerja", and "Data Vendor" tabs to populate organizational master data.
    -   **Upload Schedules**: Use the "Jadwal Shift Tim" tab to upload work schedules for employees.

## 8. Version Control (Git & GitHub)

Using version control is crucial for tracking changes and collaborating.

### 8.1. Initial Commit to GitHub

Follow these steps to upload your project to GitHub for the first time.

1.  **Initialize Git**: In your project's root directory, initialize a new Git repository.
    ```bash
    git init
    ```

2.  **Create a `.gitignore` file**: Create a file named `.gitignore` in the root of your project. This file tells Git which files and folders to ignore. This is essential to avoid committing large, unnecessary files like `node_modules`.

    ```
    # .gitignore

    # Dependencies
    /node_modules

    # Build output
    /dist

    # Logs
    npm-debug.log*
    yarn-debug.log*
    yarn-error.log*

    # Environment variables (IMPORTANT for security)
    .env
    .env.local
    .env.*.local

    # IDE and editor directories
    .idea
    .vscode
    ```

3.  **Stage and Commit**: Add all your project files to the staging area and make your first commit.
    ```bash
    git add .
    git commit -m "Initial commit: Setup HR management dashboard project"
    ```

4.  **Create a GitHub Repository**:
    -   Go to [GitHub](https://github.com/) and create a new repository.
    -   Do **not** initialize it with a README, license, or `.gitignore` file, as you already have these locally.

5.  **Link and Push**: Connect your local repository to the remote one on GitHub and push your code.
    ```bash
    # Replace <Your-GitHub-Repo-URL> with the URL from your new repository
    git remote add origin <Your-GitHub-Repo-URL>
    git branch -M main
    git push -u origin main
    ```

### 8.2. Committing Updates and New Features

Follow this standard workflow when you make changes or add new features.

1.  **Check Status**: See which files you have modified.
    ```bash
    git status
    ```

2.  **Stage Changes**: Add the specific files you want to include in your next commit.
    ```bash
    # Add a specific file
    git add src/pages/NewFeaturePage.tsx

    # Or, add all modified files
    git add .
    ```

3.  **Commit Changes**: Commit your staged changes with a clear, descriptive message. It's good practice to use **Conventional Commits** to make your commit history more readable.

    **Commit Message Format**: `<type>: <description>`

    -   `feat`: A new feature.
    -   `fix`: A bug fix.
    -   `docs`: Documentation only changes.
    -   `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc).
    -   `refactor`: A code change that neither fixes a bug nor adds a feature.
    -   `chore`: Changes to the build process or auxiliary tools.

    **Example Commits**:
    ```bash
    git commit -m "feat: Add PDF export functionality to reports"
    git commit -m "fix: Correct calculation for overtime hours"
    git commit -m "docs: Update README with deployment instructions"
    ```

4.  **Pull Latest Changes**: Before pushing, always pull the latest changes from the remote repository to ensure your local version is up-to-date and to resolve any potential conflicts.
    ```bash
    git pull origin main
    ```

5.  **Push Your Commit**: Upload your new commit to GitHub.
    ```bash
    git push origin main
    ```