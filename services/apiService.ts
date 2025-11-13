import { supabase } from './supabase';
import { UserProfile, JadwalKerja, UsulanCuti, UsulanLembur, Usulan, UsulanStatus, ShiftConfig, Presensi, UsulanSubstitusi, Seksi, UnitKerja, VendorConfig, UsulanJenis, UsulanPembetulanPresensi, LeaveQuota } from '../types';
// Fix: Import mockUserProfiles for the seeder function.
import { mockUserProfiles } from './mockData';

// Helper to handle Supabase errors
const handleSupabaseError = (error: any, context: string) => {
    if (error) {
        // Specifically ignore "Auth session missing!" during logout, as it's not a critical failure.
        // The user is already effectively logged out if there is no session.
        if (context === 'logout' && error.message === 'Auth session missing!') {
            console.warn(`Supabase warning in ${context}: Session was already missing. User is logged out.`);
            return; // Safely ignore and exit.
        }

        // Create a readable error message to prevent "[object Object]" in UI or logs.
        const readableMessage = `Supabase error in ${context}: ${error.message || 'An unknown error occurred.'}`;
        console.error(readableMessage);
        
        // Also log the full object for developers to inspect in the console.
        console.error('Full error object:', error);

        // Avoid throwing for "not found" errors which might be expected (e.g., .single() returning 0 rows)
        if (error.code !== 'PGRST116') { 
            // Throw a new error with the clear, readable message.
            throw new Error(readableMessage);
        }
    }
};

// --- HELPER FUNCTIONS for data mapping and formatting ---

// Converts YYYY-MM-DD from Supabase to DD/MM/YYYY for the frontend
const formatDateFromSupabase = (dateStr: string | null): string => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
};

// Converts DD/MM/YYYY from the frontend to YYYY-MM-DD for Supabase
const formatDateForSupabase = (dateStr: string): string => {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
};

// Converts ISO timestamp from Supabase to 'DD/MM/YYYY HH:mm:ss' for component compatibility
const formatTimestampForComponents = (isoString: string | null): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

const formatApprovalTimestamp = (isoString: string | null): string => {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return ''; // Invalid date
        const datePart = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        const timePart = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).replace(':', '.');
        return `${datePart} - ${timePart}`;
    } catch (e) {
        console.error("Error formatting approval timestamp:", isoString, e);
        return '';
    }
};


// Helper function to map snake_case from user_profiles DB to camelCase for frontend
function mapProfileToCamelCase(dbProfile: any): UserProfile | null {
    if (!dbProfile) return null;
    return {
        id: dbProfile.id,
        email: dbProfile.email,
        name: dbProfile.name,
        role: dbProfile.role,
        nik: dbProfile.nik,
        posisi: dbProfile.posisi,
        seksi: dbProfile.seksi,
        unitKerja: dbProfile.unit_kerja,
        shiftKerja: dbProfile.shift_kerja,
        noHp: dbProfile.no_hp,
        alamat: dbProfile.alamat,
        totalCutiTahunan: dbProfile.total_cuti_tahunan,
        managerId: dbProfile.manager_id,
        manager: dbProfile.manager, // This is a joined relation, Supabase makes it camelCase
    };
}

// Helper function to map snake_case from presensi DB to camelCase for frontend
function mapPresensiToCamelCase(dbPresensi: any): Presensi | null {
    if (!dbPresensi) return null;
    // Helper to convert ISO string from DB to an object compatible with Firebase's .toDate() method
    const toTimestamp = (isoString: string | null) => isoString ? { toDate: () => new Date(isoString) } : undefined;

    return {
        id: String(dbPresensi.id),
        nik: dbPresensi.nik,
        nama: dbPresensi.nama,
        tanggal: formatDateFromSupabase(dbPresensi.tanggal),
        shift: dbPresensi.shift,
        clockInTimestamp: toTimestamp(dbPresensi.clock_in_timestamp),
        clockInHealthStatus: dbPresensi.clock_in_health_status,
        clockInWorkLocationType: dbPresensi.clock_in_work_location_type,
        clockInWorkplace: dbPresensi.clock_in_workplace,
        clockInNotes: dbPresensi.clock_in_notes,
        clockInLatitude: dbPresensi.clock_in_latitude,
        clockInLongitude: dbPresensi.clock_in_longitude,
        clockOutTimestamp: toTimestamp(dbPresensi.clock_out_timestamp),
        clockOutHealthStatus: dbPresensi.clock_out_health_status,
        clockOutWorkLocationType: dbPresensi.clock_out_work_location_type,
        clockOutWorkplace: dbPresensi.clock_out_workplace,
        clockOutNotes: dbPresensi.clock_out_notes,
        clockOutLatitude: dbPresensi.clock_out_latitude,
        clockOutLongitude: dbPresensi.clock_out_longitude,
        totalHours: dbPresensi.total_hours,
    };
}

// Helper to map usulan_cuti from DB to UsulanCuti interface
function mapCutiToCamelCase(dbCuti: any): UsulanCuti {
    return {
        id: String(dbCuti.id),
        timestamp: formatTimestampForComponents(dbCuti.created_at),
        nik: dbCuti.nik,
        nama: dbCuti.nama,
        seksi: dbCuti.seksi,
        status: dbCuti.status,
        approvalTimestamp: formatApprovalTimestamp(dbCuti.approval_timestamp),
        catatanAdmin: dbCuti.catatan_admin,
        rolePengaju: dbCuti.role_pengaju,
        managerId: dbCuti.manager_id,
        jenisAjuan: dbCuti.jenis_ajuan,
        periode: {
            startDate: dbCuti.start_date,
            endDate: dbCuti.end_date,
        },
        keterangan: dbCuti.keterangan,
        linkBerkas: dbCuti.link_berkas,
        sisaCuti: dbCuti.sisa_cuti,
        cutiTerpakai: dbCuti.cuti_terpakai,
        penggantiNik: dbCuti.pengganti_nik || [],
    };
}

// Helper to map usulan_lembur from DB to UsulanLembur interface
function mapLemburToCamelCase(dbLembur: any): UsulanLembur {
    return {
        id: String(dbLembur.id),
        timestamp: formatTimestampForComponents(dbLembur.created_at),
        nik: dbLembur.nik,
        nama: dbLembur.nama,
        seksi: dbLembur.seksi,
        status: dbLembur.status,
        approvalTimestamp: formatApprovalTimestamp(dbLembur.approval_timestamp),
        catatanAdmin: dbLembur.catatan_admin,
        rolePengaju: dbLembur.role_pengaju,
        managerId: dbLembur.manager_id,
        jenisAjuan: dbLembur.jenis_ajuan,
        tanggalLembur: dbLembur.tanggal_lembur,
        shift: dbLembur.shift,
        jamAwal: dbLembur.jam_awal,
        jamAkhir: dbLembur.jam_akhir,
        tanpaIstirahat: dbLembur.tanpa_istirahat || [],
        kategoriLembur: dbLembur.kategori_lembur,
        keteranganLembur: dbLembur.keterangan_lembur,
        jamLembur: dbLembur.jam_lembur,
    };
}

// Helper to map usulan_substitusi from DB to UsulanSubstitusi interface
function mapSubstitusiToCamelCase(dbSubstitusi: any): UsulanSubstitusi {
    return {
        id: String(dbSubstitusi.id),
        timestamp: formatTimestampForComponents(dbSubstitusi.created_at),
        nik: dbSubstitusi.nik,
        nama: dbSubstitusi.nama,
        seksi: dbSubstitusi.seksi,
        status: dbSubstitusi.status,
        approvalTimestamp: formatApprovalTimestamp(dbSubstitusi.approval_timestamp),
        catatanAdmin: dbSubstitusi.catatan_admin,
        rolePengaju: dbSubstitusi.role_pengaju,
        managerId: dbSubstitusi.manager_id,
        jenisAjuan: dbSubstitusi.jenis_ajuan,
        tanggalSubstitusi: dbSubstitusi.tanggal_substitusi,
        shiftAwal: dbSubstitusi.shift_awal,
        shiftBaru: dbSubstitusi.shift_baru,
        keterangan: dbSubstitusi.keterangan,
    };
}

// Helper to map usulan_pembetulan_presensi from DB to UsulanPembetulanPresensi interface
function mapPembetulanToCamelCase(dbItem: any): UsulanPembetulanPresensi {
    return {
        id: String(dbItem.id),
        timestamp: formatTimestampForComponents(dbItem.created_at),
        nik: dbItem.nik,
        nama: dbItem.nama,
        seksi: dbItem.seksi,
        status: dbItem.status,
        approvalTimestamp: formatApprovalTimestamp(dbItem.approval_timestamp),
        catatanAdmin: dbItem.catatan_admin,
        rolePengaju: dbItem.role_pengaju,
        managerId: dbItem.manager_id,
        jenisAjuan: dbItem.jenis_ajuan,
        presensiId: dbItem.presensi_id,
        tanggalPembetulan: dbItem.tanggal_pembetulan,
        jamPembetulan: dbItem.jam_pembetulan,
        clockType: dbItem.clock_type,
        alasan: dbItem.alasan,
        linkBukti: dbItem.link_bukti,
    };
}

function mapLeaveQuotaToCamelCase(dbQuota: any): LeaveQuota {
    return {
        id: String(dbQuota.id),
        nik: dbQuota.nik,
        namaKaryawan: dbQuota.nama_karyawan,
        jenisCuti: dbQuota.jenis_cuti,
        periode: dbQuota.periode,
        masaBerlakuStart: dbQuota.masa_berlaku_start,
        masaBerlakuEnd: dbQuota.masa_berlaku_end,
        quota: dbQuota.quota,
    };
}

export const apiService = {
  // --- AUTHENTICATION ---
  login: async (email: string, password: string): Promise<UserProfile | null> => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    handleSupabaseError(authError, 'login');
    if (!authData.user) return null;

    const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*, manager:manager_id(name)')
        .eq('id', authData.user.id)
        .single();
    
    handleSupabaseError(profileError, 'login profile fetch');
    return mapProfileToCamelCase(profile);
  },
  
  logout: async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    handleSupabaseError(error, 'logout');
  },

  sendPasswordResetEmail: async (email: string): Promise<void> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin, // Supabase needs a redirect URL
    });
    handleSupabaseError(error, 'sendPasswordResetEmail');
  },

  // --- USER PROFILES ---
  createAuthUser: async (email: string, password: string): Promise<{ id: string }> => {
    // This function is intended to be called by an admin user.
    // The previous method `admin.createUser` failed with "User not allowed" because admin-level functions
    // cannot be called from the client-side with a user's token. They require a service_role key, which
    // should never be exposed in the browser.
    //
    // The correct client-side approach is to use `signUp`, but this automatically logs the new user in,
    // which logs the admin out and causes a race condition.
    //
    // SOLUTION: We will get the admin's current session, sign up the new user, and then immediately
    // restore the admin's session. This creates the user without disrupting the admin's workflow.

    // 1. Get and store the current admin's session.
    const { data: { session: adminSession }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !adminSession) {
        handleSupabaseError(sessionError, 'createAuthUser (getting admin session)');
        throw new Error('Sesi admin tidak ditemukan. Silakan login kembali.');
    }

    const sanitizedEmail = email.trim().replace(/"/g, '');
    
    // 2. Sign up the new user. This temporarily changes the auth state.
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password: password,
    });

    // 3. CRITICAL: Immediately restore the admin's session to keep them logged in.
    const { error: setSessionError } = await supabase.auth.setSession({
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token,
    });

    if (setSessionError) {
        // If this fails, the admin is likely logged out.
        handleSupabaseError(setSessionError, 'createAuthUser (restoring admin session)');
        throw new Error('Gagal memulihkan sesi admin. Silakan login kembali.');
    }
    
    // Now, we can safely handle the result of the signUp operation.
    if (signUpError) {
        if (signUpError.message.toLowerCase().includes("user already exists") || signUpError.message.toLowerCase().includes('check constraint "users_email_partial_key"')) {
            throw new Error(`Email ${sanitizedEmail} sudah terdaftar. Gunakan email lain.`);
        }
        if (signUpError.message.includes("invalid")) {
             throw new Error(`Gagal membuat akun: ${signUpError.message}. Pastikan format email sudah benar.`);
        }
        handleSupabaseError(signUpError, 'createAuthUser (signUp)');
        throw signUpError; // Throw the original for detailed console logging
    }
    
    if (!signUpData.user) {
        throw new Error('Gagal membuat akun login, pengguna tidak dikembalikan dari API.');
    }
    
    return { id: signUpData.user.id };
  },

  insertUserProfile: async (userId: string, newProfileData: Omit<UserProfile, 'id'>): Promise<UserProfile> => {
    const { email, manager, managerId, unitKerja, shiftKerja, noHp, totalCutiTahunan, ...restOfProfile } = newProfileData;
    const profilePayload = {
        id: userId,
        ...restOfProfile,
        email: email.trim().replace(/"/g, ''), // Sanitize email again
        manager_id: managerId || null,
        unit_kerja: unitKerja,
        shift_kerja: shiftKerja,
        no_hp: noHp,
        total_cuti_tahunan: totalCutiTahunan,
    };

    const { data, error } = await supabase
        .from('user_profiles')
        .insert(profilePayload)
        .select()
        .single();

    handleSupabaseError(error, 'insertUserProfile');
    if (error) {
        // In a real-world scenario with server-side capabilities, we would trigger a function
        // to delete the orphaned auth user created in the previous step.
        console.warn(`Profile creation failed for user ID ${userId}. An orphaned authentication user may exist.`);
        throw new Error(`Gagal menyimpan detail profil. Akun otentikasi mungkin sudah dibuat. Hubungi admin. Error: ${error.message}`);
    }
    if (!data) {
        throw new Error(`Gagal menyimpan detail profil untuk user baru.`);
    }
    return mapProfileToCamelCase(data) as UserProfile;
  },

  getUserProfileById: async (id: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*, manager:manager_id(name)')
        .eq('id', id)
        .single();
    
    handleSupabaseError(error, 'getUserProfileById');
    return mapProfileToCamelCase(data);
  },

  getUserProfileByNik: async (nik: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase.from('user_profiles').select('*, manager:manager_id(name)').eq('nik', nik).single();
    handleSupabaseError(error, 'getUserProfileByNik');
    return mapProfileToCamelCase(data);
  },

  getAllUserProfiles: async (): Promise<UserProfile[]> => {
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*, manager:manager_id(name)');
    handleSupabaseError(error, 'getAllUserProfiles');
    return (data || []).map(p => mapProfileToCamelCase(p)).filter((p): p is UserProfile => p !== null);
  },

  updateUserProfile: async (updatedProfile: UserProfile): Promise<UserProfile> => {
    const { id, manager, managerId, unitKerja, shiftKerja, noHp, totalCutiTahunan, ...profileData } = updatedProfile;
    const updatePayload = {
        ...profileData,
        manager_id: managerId || null,
        unit_kerja: unitKerja,
        shift_kerja: shiftKerja,
        no_hp: noHp,
        total_cuti_tahunan: totalCutiTahunan,
    };
    
    const { data, error } = await supabase.from('user_profiles').update(updatePayload).eq('id', id).select().single();
    handleSupabaseError(error, 'updateUserProfile');
    return mapProfileToCamelCase(data) as UserProfile;
  },

  deleteUserProfile: async (id: string): Promise<void> => {
    // This should delete from user_profiles. Deleting from auth.users needs to be done on the server.
    const { error } = await supabase.from('user_profiles').delete().eq('id', id);
    handleSupabaseError(error, 'deleteUserProfile');
  },

  batchUpsertUserProfiles: async (profiles: Omit<UserProfile, 'id'>[]): Promise<void> => {
      console.warn("Batch upsert only UPDATES existing profiles based on email. It does not create new auth users.");
      for (const profile of profiles) {
          try {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { manager, managerId, unitKerja, shiftKerja, noHp, totalCutiTahunan, ...restOfProfile } = profile;
              const updatePayload = {
                  ...restOfProfile,
                  manager_id: managerId || null,
                  unit_kerja: unitKerja,
                  shift_kerja: shiftKerja,
                  no_hp: noHp,
                  total_cuti_tahunan: totalCutiTahunan,
              };

              const { error } = await supabase
                .from('user_profiles')
                .update(updatePayload)
                .eq('email', profile.email);
            
              if (error) {
                console.error(`Failed to batch update profile for ${profile.email}:`, error);
              }
          } catch (e) {
              console.error(`Exception during batch update for ${profile.email}:`, e);
          }
      }
  },

  seedDatabase: async (): Promise<string> => {
    console.log("Seeding database with user profiles...");
    for (const profile of mockUserProfiles) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, manager, ...restOfProfile } = profile;
            const updatePayload = {
                ...restOfProfile,
                manager_id: profile.managerId || null,
                unit_kerja: profile.unitKerja,
                shift_kerja: profile.shiftKerja,
                no_hp: profile.noHp,
                total_cuti_tahunan: profile.totalCutiTahunan,
            };
            const { error } = await supabase
                .from('user_profiles')
                .update(updatePayload)
                .eq('email', profile.email);
            
            if (error) {
                 console.error(`Failed to seed profile for ${profile.email}:`, error.message);
            }
        } catch (error) {
            console.error(`Exception during seeding for ${profile.email}:`, error);
        }
    }
    return `Attempted to seed ${mockUserProfiles.length} user profiles into Supabase. Check console for errors. Other data is now live.`;
  },

  // --- SEKSI, UNIT KERJA, VENDOR (LIVE DATA) ---
  getAllSeksi: async (): Promise<Seksi[]> => {
    const { data, error } = await supabase.from('seksi').select('*').order('name');
    handleSupabaseError(error, 'getAllSeksi');
    return (data || []).map(s => ({ ...s, id: String(s.id) }));
  },
  addSeksi: async (newSeksi: Omit<Seksi, 'id'>): Promise<Seksi> => {
    const { data, error } = await supabase.from('seksi').insert(newSeksi).select().single();
    handleSupabaseError(error, 'addSeksi');
    return { ...data, id: String(data.id) } as Seksi;
  },
  updateSeksi: async (updatedSeksi: Seksi): Promise<Seksi> => {
    const { id, name } = updatedSeksi;
    const { data, error } = await supabase.from('seksi').update({ name }).eq('id', id).select().single();
    handleSupabaseError(error, 'updateSeksi');
    return { ...data, id: String(data.id) } as Seksi;
  },
  deleteSeksi: async (id: string): Promise<void> => {
    const { error } = await supabase.from('seksi').delete().eq('id', id);
    handleSupabaseError(error, 'deleteSeksi');
  },

  getAllUnitKerja: async (): Promise<UnitKerja[]> => {
    const { data, error } = await supabase.from('unit_kerja').select('*').order('name');
    handleSupabaseError(error, 'getAllUnitKerja');
    return (data || []).map(u => ({ ...u, id: String(u.id) }));
  },
  addUnitKerja: async (newUnitKerja: Omit<UnitKerja, 'id'>): Promise<UnitKerja> => {
    const { data, error } = await supabase.from('unit_kerja').insert(newUnitKerja).select().single();
    handleSupabaseError(error, 'addUnitKerja');
    return { ...data, id: String(data.id) } as UnitKerja;
  },
  updateUnitKerja: async (updatedUnitKerja: UnitKerja): Promise<UnitKerja> => {
    const { id, name } = updatedUnitKerja;
    const { data, error } = await supabase.from('unit_kerja').update({ name }).eq('id', id).select().single();
    handleSupabaseError(error, 'updateUnitKerja');
    return { ...data, id: String(data.id) } as UnitKerja;
  },
  deleteUnitKerja: async (id: string): Promise<void> => {
    const { error } = await supabase.from('unit_kerja').delete().eq('id', id);
    handleSupabaseError(error, 'deleteUnitKerja');
  },

  getAllVendorConfigs: async (): Promise<VendorConfig[]> => {
    const { data, error } = await supabase.from('vendor_configs').select('*').order('nama_vendor');
    handleSupabaseError(error, 'getAllVendorConfigs');
    return (data || []).map(item => ({ id: String(item.id), namaVendor: item.nama_vendor, namaAdmin: item.nama_admin }));
  },
  addVendorConfig: async (newConfig: Omit<VendorConfig, 'id'>): Promise<VendorConfig> => {
    const { namaVendor, namaAdmin } = newConfig;
    const { data, error } = await supabase.from('vendor_configs').insert({ nama_vendor: namaVendor, nama_admin: namaAdmin }).select().single();
    handleSupabaseError(error, 'addVendorConfig');
    return { id: String(data.id), namaVendor: data.nama_vendor, namaAdmin: data.nama_admin };
  },
  updateVendorConfig: async (updatedConfig: VendorConfig): Promise<VendorConfig> => {
    const { id, namaVendor, namaAdmin } = updatedConfig;
    const { data, error } = await supabase.from('vendor_configs').update({ nama_vendor: namaVendor, nama_admin: namaAdmin }).eq('id', id).select().single();
    handleSupabaseError(error, 'updateVendorConfig');
    return { id: String(data.id), namaVendor: data.nama_vendor, namaAdmin: data.nama_admin };
  },
  deleteVendorConfig: async (id: string): Promise<void> => {
    const { error } = await supabase.from('vendor_configs').delete().eq('id', id);
    handleSupabaseError(error, 'deleteVendorConfig');
  },

  // --- SHIFT CONFIGS (LIVE DATA) ---
  getShiftConfigs: async (): Promise<ShiftConfig[]> => {
    const { data, error } = await supabase.from('shift_configs').select('*').order('group').order('name');
    handleSupabaseError(error, 'getShiftConfigs');
    return (data || []) as ShiftConfig[];
  },
  addShiftConfig: async (newConfigData: Omit<ShiftConfig, 'id'>): Promise<ShiftConfig> => {
    const { data, error } = await supabase.from('shift_configs').insert(newConfigData).select().single();
    handleSupabaseError(error, 'addShiftConfig');
    return data as ShiftConfig;
  },
  updateShiftConfig: async (updatedConfig: ShiftConfig): Promise<ShiftConfig> => {
    const { id, ...updateData } = updatedConfig;
    const { data, error } = await supabase.from('shift_configs').update(updateData).eq('id', id).select().single();
    handleSupabaseError(error, 'updateShiftConfig');
    return data as ShiftConfig;
  },
  deleteShiftConfig: async (id: string): Promise<void> => {
    const { error } = await supabase.from('shift_configs').delete().eq('id', id);
    handleSupabaseError(error, 'deleteShiftConfig');
  },

  // --- JADWAL KERJA (LIVE DATA) ---
  getJadwalByNik: async (nik: string): Promise<JadwalKerja[]> => {
    const { data, error } = await supabase.from('jadwal_kerja').select('*').eq('nik', nik);
    if (error && error.code === '42P01') {
        console.warn("Supabase warning in getJadwalByNik: Table 'jadwal_kerja' not found. Returning empty array. Please create the table in your Supabase project.");
        return [];
    }
    handleSupabaseError(error, 'getJadwalByNik');
    return (data || []).map(j => ({ ...j, id: String(j.id), tanggal: formatDateFromSupabase(j.tanggal) }));
  },
  
  getAllJadwal: async (): Promise<JadwalKerja[]> => {
    const { data, error } = await supabase.from('jadwal_kerja').select('*');
    if (error && error.code === '42P01') {
        console.warn("Supabase warning in getAllJadwal: Table 'jadwal_kerja' not found. Returning empty array. Please create the table in your Supabase project.");
        return [];
    }
    handleSupabaseError(error, 'getAllJadwal');
    return (data || []).map(j => ({ ...j, id: String(j.id), tanggal: formatDateFromSupabase(j.tanggal) }));
  },

  upsertJadwal: async (newJadwal: Omit<JadwalKerja, 'id' | 'nama' | 'seksi'>): Promise<JadwalKerja> => {
    const { nik, tanggal, shift } = newJadwal;
    const { data: employee } = await supabase.from('user_profiles').select('name, seksi').eq('nik', nik).single();
    if (!employee) throw new Error(`Employee with NIK ${nik} not found.`);

    const payload = {
      nik,
      tanggal: formatDateForSupabase(tanggal),
      shift,
      nama: employee.name,
      seksi: employee.seksi
    };
    
    const { data, error } = await supabase
      .from('jadwal_kerja')
      .upsert(payload, { onConflict: 'nik,tanggal' })
      .select()
      .single();

    if (error && error.code === '42P01') {
        const userMessage = "Tabel 'jadwal_kerja' tidak ditemukan. Gagal menyimpan jadwal. Silakan hubungi administrator untuk membuat tabel di database.";
        console.error(`Supabase error in upsertJadwal: ${userMessage}`);
        throw new Error(userMessage);
    }
    handleSupabaseError(error, 'upsertJadwal');
    const resultData = data as any;
    return { ...resultData, id: String(resultData.id), tanggal: formatDateFromSupabase(resultData.tanggal) };
  },

  // --- FINGERPRINTING ---
  getFingerprintForUser: async (userId: string): Promise<{ fingerprint_id: string } | null> => {
    const { data, error } = await supabase.from('user_device_fingerprints').select('fingerprint_id').eq('user_id', userId).single();
    if (error && error.code === '42P01') { // undefined_table
        throw new Error("Tabel 'user_device_fingerprints' tidak ditemukan. Silakan lihat README.md untuk instruksi setup database.");
    }
    handleSupabaseError(error, 'getFingerprintForUser');
    return data;
  },

  setFingerprintForUser: async (userId: string, fingerprintId: string): Promise<void> => {
    const { error } = await supabase.from('user_device_fingerprints').insert({ user_id: userId, fingerprint_id: fingerprintId });
    if (error && error.code === '42P01') { // undefined_table
      throw new Error("Tabel 'user_device_fingerprints' tidak ditemukan. Fitur keamanan perangkat dinonaktifkan. Silakan lihat README.md untuk instruksi setup database.");
    }
    handleSupabaseError(error, 'setFingerprintForUser');
  },

  // --- PRESENSI (LIVE DATA) ---
  getAllPresensi: async (): Promise<Presensi[]> => {
    const { data, error } = await supabase.from('presensi').select('*');
    if (error && error.code === '42P01') {
        console.warn("Supabase warning in getAllPresensi: Table 'presensi' not found. Returning empty array. Please create the table in your Supabase project.");
        return [];
    }
    handleSupabaseError(error, 'getAllPresensi');
    return (data || []).map(p => mapPresensiToCamelCase(p)).filter((p): p is Presensi => p !== null);
  },

  getPresensiByNik: async (nik: string): Promise<Presensi[]> => {
    const { data, error } = await supabase.from('presensi').select('*').eq('nik', nik);
    if (error && error.code === '42P01') {
        console.warn("Supabase warning in getPresensiByNik: Table 'presensi' not found. Returning empty array. Please create the table in your Supabase project.");
        return [];
    }
    handleSupabaseError(error, 'getPresensiByNik');
    return (data || []).map(p => mapPresensiToCamelCase(p)).filter((p): p is Presensi => p !== null);
  },
  
  submitClockEvent: async (user: UserProfile, action: 'in' | 'out', data: any): Promise<void> => {
    const { position, todaySchedule, fingerprintId, ...formData } = data;

    // Fingerprint check only for 'Bekerja di Pabrik'
    if (formData.workLocationType === 'Bekerja di Pabrik') {
        const storedFingerprint = await apiService.getFingerprintForUser(user.id);
        if (storedFingerprint) {
            if (storedFingerprint.fingerprint_id !== fingerprintId) {
                throw new Error("Perangkat tidak dikenali. Silakan gunakan perangkat yang biasa Anda gunakan untuk absen untuk mencegah penyalahgunaan akun.");
            }
        }
    }
    
    const todayYYYYMMDD = new Date().toISOString().split('T')[0];
    const { data: existingRecord, error: fetchError } = await supabase.from('presensi').select('*').eq('nik', user.nik).eq('tanggal', todayYYYYMMDD).maybeSingle();
    if (fetchError && fetchError.code === '42P01') {
        const userMessage = "Tabel 'presensi' tidak ditemukan. Gagal menyimpan data presensi. Silakan hubungi administrator untuk membuat tabel di database.";
        console.error(`Supabase error in submitClockEvent: ${userMessage}`);
        throw new Error(userMessage);
    }
    handleSupabaseError(fetchError, 'submitClockEvent (fetch)');

    if (action === 'out' && (!existingRecord || !existingRecord.clock_in_timestamp)) {
      throw new Error("Clock-in tidak ditemukan. Anda tidak dapat melakukan clock-out.");
    }

    if (action === 'in') {
      const payload = {
        nik: user.nik,
        nama: user.name,
        tanggal: todayYYYYMMDD,
        shift: todaySchedule.shift,
        clock_in_timestamp: new Date().toISOString(),
        clock_in_health_status: formData.healthStatus,
        clock_in_work_location_type: formData.workLocationType,
        clock_in_workplace: formData.workplace,
        clock_in_notes: formData.notes,
        clock_in_latitude: position.coords.latitude,
        clock_in_longitude: position.coords.longitude,
      };
      const { error } = await supabase.from('presensi').upsert(payload, { onConflict: 'nik,tanggal' });
      handleSupabaseError(error, 'submitClockEvent (clock-in)');
    } else { // action === 'out'
      const clockInTime = new Date(existingRecord.clock_in_timestamp);
      const clockOutTime = new Date();
      const totalHours = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);

      const payload = {
        clock_out_timestamp: clockOutTime.toISOString(),
        clock_out_health_status: formData.healthStatus,
        clock_out_work_location_type: formData.workLocationType,
        clock_out_workplace: formData.workplace,
        clock_out_notes: formData.notes,
        clock_out_latitude: position.coords.latitude,
        clock_out_longitude: position.coords.longitude,
        total_hours: parseFloat(totalHours.toFixed(2)),
      };
      const { error } = await supabase.from('presensi').update(payload).eq('id', existingRecord.id);
      handleSupabaseError(error, 'submitClockEvent (clock-out)');
    }

    // After successful clock event for 'Bekerja di Pabrik', bind fingerprint if it doesn't exist
    if (formData.workLocationType === 'Bekerja di Pabrik') {
        const storedFingerprint = await apiService.getFingerprintForUser(user.id);
        if (!storedFingerprint) {
            await apiService.setFingerprintForUser(user.id, fingerprintId);
        }
    }
  },

  // --- PROPOSALS (LIVE DATA) ---
  uploadProofFile: async (file: File, fileName: string): Promise<string> => {
    const { data, error } = await supabase.storage.from('bukti_izin').upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
    });
    
    if (error) {
        if (error.message.toLowerCase().includes('bucket not found')) {
            const userMessage = `Supabase Storage Error: Bucket 'bukti_izin' not found.
---
SETUP INSTRUCTIONS
---
**Part 1: Create the Bucket**
1. Go to the **Storage** section in your Supabase Dashboard.
2. Click **'New bucket'**.
3. Name the bucket exactly: **bukti_izin**
4. Turn ON **'Public bucket'**.
5. Click **'Create bucket'**.

**Part 2: Create Security Policies**
1. After creating the bucket, go to **Storage -> Policies**.
2. Click **'New policy'** next to the **'objects'** table (under the 'Schema' section).
3. Select **'Create a new policy from scratch'**.
4. Create the **first policy** to allow uploads:
   - Policy Name: \`Allow authenticated uploads\`
   - Allowed operation: \`INSERT\`
   - Target roles: \`authenticated\`
   - WITH CHECK expression: \`bucket_id = 'bukti_izin'\`
5. Create the **second policy** to allow users to view their own files:
   - Policy Name: \`Allow users to view their own files\`
   - Allowed operation: \`SELECT\`
   - Target roles: \`authenticated\`
   - USING expression: \`bucket_id = 'bukti_izin' AND auth.uid() = owner\`

**Note:** Policies are applied to the 'objects' table, not directly on the bucket page. It is normal for the bucket page to show 'No policies created yet'.`;
            throw new Error(userMessage);
        }
        handleSupabaseError(error, 'uploadProofFile');
    }

    const { data: publicUrlData } = supabase.storage.from('bukti_izin').getPublicUrl(data!.path);
    return publicUrlData.publicUrl;
  },

  getCutiByNik: async (nik: string): Promise<UsulanCuti[]> => {
      const { data, error } = await supabase.from('usulan_cuti').select('*').eq('nik', nik);
      handleSupabaseError(error, 'getCutiByNik');
      return (data || []).map(mapCutiToCamelCase);
  },
  getLemburByNik: async (nik: string): Promise<UsulanLembur[]> => {
      const { data, error } = await supabase.from('usulan_lembur').select('*').eq('nik', nik);
      handleSupabaseError(error, 'getLemburByNik');
      return (data || []).map(mapLemburToCamelCase);
  },
  getSubstitusiByNik: async (nik: string): Promise<UsulanSubstitusi[]> => {
      const { data, error } = await supabase.from('usulan_substitusi').select('*').eq('nik', nik);
      handleSupabaseError(error, 'getSubstitusiByNik');
      return (data || []).map(mapSubstitusiToCamelCase);
  },
  getPembetulanPresensiByNik: async (nik: string): Promise<UsulanPembetulanPresensi[]> => {
      const { data, error } = await supabase.from('usulan_pembetulan_presensi').select('*').eq('nik', nik);
      handleSupabaseError(error, 'getPembetulanPresensiByNik');
      return (data || []).map(mapPembetulanToCamelCase);
  },
  getAllCuti: async (): Promise<UsulanCuti[]> => {
      const { data, error } = await supabase.from('usulan_cuti').select('*');
      handleSupabaseError(error, 'getAllCuti');
      return (data || []).map(mapCutiToCamelCase);
  },
  getAllLembur: async (): Promise<UsulanLembur[]> => {
      const { data, error } = await supabase.from('usulan_lembur').select('*');
      handleSupabaseError(error, 'getAllLembur');
      return (data || []).map(mapLemburToCamelCase);
  },
  getAllSubstitusi: async (): Promise<UsulanSubstitusi[]> => {
      const { data, error } = await supabase.from('usulan_substitusi').select('*');
      handleSupabaseError(error, 'getAllSubstitusi');
      return (data || []).map(mapSubstitusiToCamelCase);
  },
  getAllPembetulanPresensi: async (): Promise<UsulanPembetulanPresensi[]> => {
      const { data, error } = await supabase.from('usulan_pembetulan_presensi').select('*');
      handleSupabaseError(error, 'getAllPembetulanPresensi');
      return (data || []).map(mapPembetulanToCamelCase);
  },


  addCuti: async (newCuti: Omit<UsulanCuti, 'id' | 'timestamp' | 'sisaCuti' | 'cutiTerpakai' | 'authorUid'>): Promise<UsulanCuti> => {
      const { data: userProfile } = await supabase.from('user_profiles').select('manager_id').eq('nik', newCuti.nik).single();
      const payload = {
          nik: newCuti.nik,
          nama: newCuti.nama,
          seksi: newCuti.seksi,
          status: newCuti.status,
          role_pengaju: newCuti.rolePengaju,
          manager_id: userProfile?.manager_id,
          jenis_ajuan: newCuti.jenisAjuan,
          start_date: newCuti.periode.startDate,
          end_date: newCuti.periode.endDate,
          keterangan: newCuti.keterangan,
          link_berkas: newCuti.linkBerkas,
          pengganti_nik: newCuti.penggantiNik,
      };
      const { data, error } = await supabase.from('usulan_cuti').insert(payload).select().single();
      handleSupabaseError(error, 'addCuti');
      return mapCutiToCamelCase(data);
  },
  addLembur: async (newLembur: Omit<UsulanLembur, 'id' | 'timestamp' | 'authorUid'>): Promise<UsulanLembur> => {
      const { data: userProfile } = await supabase.from('user_profiles').select('manager_id').eq('nik', newLembur.nik).single();
      const payload = {
          nik: newLembur.nik,
          nama: newLembur.nama,
          seksi: newLembur.seksi,
          status: newLembur.status,
          role_pengaju: newLembur.rolePengaju,
          manager_id: userProfile?.manager_id,
          jenis_ajuan: newLembur.jenisAjuan,
          tanggal_lembur: newLembur.tanggalLembur,
          shift: newLembur.shift,
          jam_awal: newLembur.jamAwal,
          jam_akhir: newLembur.jamAkhir,
          tanpa_istirahat: newLembur.tanpaIstirahat,
          kategori_lembur: newLembur.kategoriLembur,
          keterangan_lembur: newLembur.keteranganLembur,
          jam_lembur: newLembur.jamLembur,
      };
      const { data, error } = await supabase.from('usulan_lembur').insert(payload).select().single();
      handleSupabaseError(error, 'addLembur');
      return mapLemburToCamelCase(data);
  },
  addSubstitusi: async (newSubstitusi: Omit<UsulanSubstitusi, 'id' | 'timestamp' | 'authorUid'>): Promise<UsulanSubstitusi> => {
      const { data: userProfile } = await supabase.from('user_profiles').select('manager_id').eq('nik', newSubstitusi.nik).single();
      const payload = {
          nik: newSubstitusi.nik,
          nama: newSubstitusi.nama,
          seksi: newSubstitusi.seksi,
          status: newSubstitusi.status,
          role_pengaju: newSubstitusi.rolePengaju,
          manager_id: userProfile?.manager_id,
          jenis_ajuan: newSubstitusi.jenisAjuan,
          tanggal_substitusi: newSubstitusi.tanggalSubstitusi,
          shift_awal: newSubstitusi.shiftAwal,
          shift_baru: newSubstitusi.shiftBaru,
          keterangan: newSubstitusi.keterangan,
      };
      const { data, error } = await supabase.from('usulan_substitusi').insert(payload).select().single();
      handleSupabaseError(error, 'addSubstitusi');
      return mapSubstitusiToCamelCase(data);
  },
  addPembetulanPresensi: async (newPembetulan: Omit<UsulanPembetulanPresensi, 'id' | 'timestamp' | 'authorUid'>): Promise<UsulanPembetulanPresensi> => {
      const payload = {
          nik: newPembetulan.nik,
          nama: newPembetulan.nama,
          seksi: newPembetulan.seksi,
          status: newPembetulan.status,
          role_pengaju: newPembetulan.rolePengaju,
          manager_id: newPembetulan.managerId,
          jenis_ajuan: newPembetulan.jenisAjuan,
          presensi_id: newPembetulan.presensiId,
          tanggal_pembetulan: newPembetulan.tanggalPembetulan,
          jam_pembetulan: newPembetulan.jamPembetulan,
          clock_type: newPembetulan.clockType,
          alasan: newPembetulan.alasan,
          link_bukti: newPembetulan.linkBukti,
      };
      const { data, error } = await supabase.from('usulan_pembetulan_presensi').insert(payload).select().single();
      
      if (error && error.code === '42P01') { // 42P01 is 'undefined_table'
            const userMessage = `Supabase DB Error: Table 'usulan_pembetulan_presensi' not found. 
            
Please run the following SQL in your Supabase SQL Editor:
            
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

-- Enable Row Level Security
ALTER TABLE public.usulan_pembetulan_presensi ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow users to insert their own requests"
ON public.usulan_pembetulan_presensi FOR INSERT
TO authenticated
WITH CHECK (nik = (SELECT nik FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Allow users to view their own requests"
ON public.usulan_pembetulan_presensi FOR SELECT
TO authenticated
USING (nik = (SELECT nik FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Allow managers and admins to view/update all requests"
ON public.usulan_pembetulan_presensi FOR ALL
TO authenticated
USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('Manager', 'Admin', 'SuperAdmin'));
`;
            throw new Error(userMessage);
      }

      handleSupabaseError(error, 'addPembetulanPresensi');
      return mapPembetulanToCamelCase(data);
  },

  updateCuti: async (id: string, updatedData: Partial<UsulanCuti>): Promise<UsulanCuti> => {
      const payload: Record<string, any> = {};
      if (updatedData.periode) {
          payload.start_date = updatedData.periode.startDate;
          payload.end_date = updatedData.periode.endDate;
      }
      if (updatedData.keterangan) payload.keterangan = updatedData.keterangan;
      if (updatedData.penggantiNik) payload.pengganti_nik = updatedData.penggantiNik;
      const { data, error } = await supabase.from('usulan_cuti').update(payload).eq('id', id).select().single();
      handleSupabaseError(error, 'updateCuti');
      return mapCutiToCamelCase(data);
  },
  updateLembur: async (id: string, updatedData: Partial<UsulanLembur>): Promise<UsulanLembur> => {
      const payload: Record<string, any> = {};
      // Add fields to update as needed
      if (updatedData.keteranganLembur) payload.keterangan_lembur = updatedData.keteranganLembur;

      const { data, error } = await supabase.from('usulan_lembur').update(payload).eq('id', id).select().single();
      handleSupabaseError(error, 'updateLembur');
      return mapLemburToCamelCase(data);
  },
  updateSubstitusi: async (id: string, updatedData: Partial<UsulanSubstitusi>): Promise<UsulanSubstitusi> => {
       const payload: Record<string, any> = {};
      // Add fields to update as needed
      if (updatedData.keterangan) payload.keterangan = updatedData.keterangan;

      const { data, error } = await supabase.from('usulan_substitusi').update(payload).eq('id', id).select().single();
      handleSupabaseError(error, 'updateSubstitusi');
      return mapSubstitusiToCamelCase(data);
  },

  requestCutiCancellation: async (id: string): Promise<void> => {
      const { error } = await supabase.from('usulan_cuti').update({ status: UsulanStatus.PembatalanDiajukan }).eq('id', id);
      handleSupabaseError(error, 'requestCutiCancellation');
  },

  updateProposalStatus: async (id: string, type: 'cuti' | 'lembur' | 'substitusi' | 'pembetulan', status: UsulanStatus, catatanAdmin?: string): Promise<void> => {
      const tableNameMap = {
        cuti: 'usulan_cuti',
        lembur: 'usulan_lembur',
        substitusi: 'usulan_substitusi',
        pembetulan: 'usulan_pembetulan_presensi',
      };
      const tableName = tableNameMap[type];
      const payload: { status: UsulanStatus, catatan_admin?: string, approval_timestamp?: string } = {
          status,
          approval_timestamp: new Date().toISOString()
      };
      if (catatanAdmin) {
          payload.catatan_admin = catatanAdmin;
      }
      const { error } = await supabase.from(tableName).update(payload).eq('id', id);
      handleSupabaseError(error, `updateProposalStatus for ${type}`);
  },

  deleteProposal: async (id: string, type: 'cuti' | 'lembur' | 'substitusi' | 'pembetulan'): Promise<void> => {
      const tableNameMap = {
        cuti: 'usulan_cuti',
        lembur: 'usulan_lembur',
        substitusi: 'usulan_substitusi',
        pembetulan: 'usulan_pembetulan_presensi',
      };
      const tableName = tableNameMap[type];
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      handleSupabaseError(error, `deleteProposal for ${type}`);
  },

  // --- LEAVE QUOTAS (LIVE DATA) ---
  getAllLeaveQuotas: async (): Promise<LeaveQuota[]> => {
    const { data, error } = await supabase.from('quota_cuti').select('*');
    handleSupabaseError(error, 'getAllLeaveQuotas');
    return (data || []).map(mapLeaveQuotaToCamelCase);
  },

  addLeaveQuota: async (newQuota: Omit<LeaveQuota, 'id'>): Promise<LeaveQuota> => {
    const payload = {
        nik: newQuota.nik,
        nama_karyawan: newQuota.namaKaryawan,
        jenis_cuti: newQuota.jenisCuti,
        periode: newQuota.periode,
        masa_berlaku_start: newQuota.masaBerlakuStart,
        masa_berlaku_end: newQuota.masaBerlakuEnd,
        quota: newQuota.quota,
    };
    const { data, error } = await supabase.from('quota_cuti').insert(payload).select().single();
    handleSupabaseError(error, 'addLeaveQuota');
    return mapLeaveQuotaToCamelCase(data);
  },

  updateLeaveQuota: async (updatedQuota: LeaveQuota): Promise<LeaveQuota> => {
    const { id, ...rest } = updatedQuota;
    const payload = {
        nik: rest.nik,
        nama_karyawan: rest.namaKaryawan,
        jenis_cuti: rest.jenisCuti,
        periode: rest.periode,
        masa_berlaku_start: rest.masaBerlakuStart,
        masa_berlaku_end: rest.masaBerlakuEnd,
        quota: rest.quota,
    };
    const { data, error } = await supabase.from('quota_cuti').update(payload).eq('id', id).select().single();
    handleSupabaseError(error, 'updateLeaveQuota');
    return mapLeaveQuotaToCamelCase(data);
  },

  deleteLeaveQuota: async (id: string): Promise<void> => {
    const { error } = await supabase.from('quota_cuti').delete().eq('id', id);
    handleSupabaseError(error, 'deleteLeaveQuota');
  },
};