import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  PropsWithChildren,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

type PatientProfile = {
  first_name: string;
  last_name: string;
  gender: string;
  birthdate: string;
  photo_url?: string;
  mobile_number: string;
};

type ClinicProfile = {
  clinic_name: string;
  mobile_number: string;
  address: string;
  clinic_photo_url?: string;
  license_photo_url?: string;
};

type SessionContextType = {
  isAuthenticated: boolean;
  session: Session | null;
  isLoading: boolean;
  role: string;
  signIn: (email: string, password: string) => void;
  signUp: (
    email: string,
    password: string,
    profile: PatientProfile
  ) => Promise<void>;
  signUpClinic: (
    email: string,
    password: string,
    clinicProfile: ClinicProfile
  ) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (newPassword: string) => Promise<void>; // ✅ NEW
};

const SessionContext = createContext<SessionContextType>({
  isAuthenticated: false,
  session: null,
  isLoading: true,
  role: "",
  signIn: async () => {},
  signUp: async () => {},
  signUpClinic: async () => {},
  signOut: async () => {},
  resetPassword: async () => {}, // ✅ NEW
});

export const useSession = () => useContext(SessionContext);

// 📸 Upload photo to Supabase storage
const uploadPhoto = async (
  uri: string,
  folder: string
): Promise<string | null> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const ext = uri.split(".").pop()?.split("?")[0] || "jpg";
    const filePath = `${folder}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("clinic-photos")
      .upload(filePath, blob, { upsert: true });

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from("clinic-photos")
      .getPublicUrl(filePath);

    return publicUrlData?.publicUrl ?? null;
  } catch (err) {
    console.error("Upload exception:", err);
    return null;
  }
};

export const SessionProvider = ({ children }: PropsWithChildren) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [role, setRole] = useState<string>("");

const emailExists = async (email: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  return !!data;
};

const signUp = async (
  email: string,
  password: string,
  profile: PatientProfile
): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: "https://www.smilestudio.works/verify",
      },
    });

    if (error) {
      const msg = error.message.toLowerCase();

      if (
        msg.includes("user already") ||
        msg.includes("email already") ||
        msg.includes("duplicate")
      ) {
        alert("🚫 This email is already taken.");
        return false;
      }

      alert(`Sign-up failed: ${error.message}`);
      return false;
    }

    // Save temp profile for later use on login
    await AsyncStorage.setItem("temp_profile", JSON.stringify(profile));

    return true; // Success
  } catch (err: any) {
    console.error("Sign-up error:", err);
    alert("⚠️ An unexpected error occurred during sign-up.");
    return false;
  }
};


const signUpClinic = async (
  email: string,
  password: string,
  clinicProfile: any
): Promise<boolean> => {
  try {
    // Sign up with Supabase auth
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: "https://www.smilestudio.works/verify",
      },
    });

    if (error) {
      const msg = error.message.toLowerCase();

      if (
        msg.includes("user already") ||
        msg.includes("email already") ||
        msg.includes("duplicate")
      ) {
        alert("🚫 This email is already taken.");
        return false;
      }

      alert(`Sign-up failed: ${error.message}`);
      return false;
    }

    // ✅ Do NOT insert into profiles yet — wait for email verification + login
    await AsyncStorage.setItem("temp_clinic_profile", JSON.stringify(clinicProfile));

    return true;
  } catch (err: any) {
    console.error("Clinic sign-up error:", err);
    alert("⚠️ An unexpected error occurred. Please try again later.");
    return false;
  }
};



const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    const { session, user } = data;
    if (!session || !user) throw new Error("No session or user returned.");

    // Check if patient profile exists
    const { data: patientProfile, error: patientError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (patientError) throw patientError;

    // If no patient profile, insert it from temp storage
    if (!patientProfile) {
      const storedProfile = await AsyncStorage.getItem("temp_profile");
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile);

        const { error: insertError } = await supabase.from("profiles").insert([
          {
            id: user.id,
            email: user.email || null,  // safe fallback
            first_name: parsed.first_name,
            last_name: parsed.last_name,
            gender: parsed.gender,
            birthdate: parsed.birthdate,
            avatar_url: parsed.photo_url || null,
            mobile_number: parsed.mobile_number,
            role: "Patient",
          },
        ]);
        if (insertError) throw insertError;

        await AsyncStorage.removeItem("temp_profile");
      }
    }

    // Check if clinic profile exists
    const { data: clinicProfile, error: clinicError } = await supabase
      .from("clinic_profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (clinicError) throw clinicError;

    // Insert clinic profile if missing
    if (!clinicProfile) {
      const storedClinic = await AsyncStorage.getItem("temp_clinic_profile");
      if (storedClinic) {
        const parsed = JSON.parse(storedClinic);

        const uploadedClinicPhotoUrl = parsed.clinic_photo_url
          ? await uploadPhoto(parsed.clinic_photo_url, "clinic")
          : null;

        const uploadedLicensePhotoUrl = parsed.license_photo_url
          ? await uploadPhoto(parsed.license_photo_url, "license")
          : null;

        const { error: insertClinicError } = await supabase.from("clinic_profiles").insert([
          {
            id: user.id,
            clinic_name: parsed.clinic_name,
            address: parsed.address,
            mobile_number: parsed.mobile_number,
            clinic_photo_url: uploadedClinicPhotoUrl,
            license_photo_url: uploadedLicensePhotoUrl,
            role: "Clinic",
          },
        ]);
        if (insertClinicError) throw insertClinicError;

        await AsyncStorage.removeItem("temp_clinic_profile");
      }
    }

    // Check roles for user
    const [{ data: adminCheck }, { data: clinicCheck }, { data: patientCheck }] =
      await Promise.all([
        supabase.from("admin_profiles").select("role").eq("id", user.id).maybeSingle(),
        supabase.from("clinic_profiles").select("role").eq("id", user.id).maybeSingle(),
        supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
      ]);

    let role = "";
    if (adminCheck?.role?.toLowerCase() === "admin") {
      role = "admin";
    } else if (clinicCheck?.role) {
      role = "clinic";
    } else if (patientCheck?.role) {
      role = "patient";
    }

    // Store tokens and user info locally
    await AsyncStorage.multiSet([
      ["access_token", session.access_token],
      ["refresh_token", session.refresh_token],
      ["user_id", user.id],
      ["user_role", role],
    ]);

    // Update state
    setRole(role);
    setSession(session);
    setAuthenticated(true);
  } catch (err: any) {
    console.error("Sign-in error:", err?.message || err);
    if (!err?.message?.toLowerCase().includes("invalid")) {
      alert("⚠️ An error occurred while signing in.");
    }
  }
};


  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setSession(null);
      setAuthenticated(false);
      await AsyncStorage.multiRemove([
        "access_token",
        "refresh_token",
        "user_id",
        "user_role",
      ]);
    } catch (err: any) {
      console.error("Sign-out error:", err.message || err);
      throw err;
    }
  };

  // ✅ Add resetPassword handler
  const resetPassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        console.error("❌ Failed to update password:", error.message);
        throw error;
      }
      console.log("✅ Password updated successfully.");
    } catch (err: any) {
      console.error("Password update exception:", err);
      throw err;
    }
  };

  useEffect(() => {
    let authSubscription: ReturnType<
      typeof supabase.auth.onAuthStateChange
    >["data"]["subscription"];

    const restoreSession = async () => {
      try {
        const [[, accessToken], [, refreshToken], [, storedRole]] =
          await AsyncStorage.multiGet([
            "access_token",
            "refresh_token",
            "user_role",
          ]);

        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error("🔁 Session restore error:", error.message);
            setAuthenticated(false);
            setSession(null);
          } else {
            setSession(data.session);
            setAuthenticated(true);
          }
        }

        if (storedRole) setRole(storedRole);
      } catch (err) {
        console.error("⚠️ Session restore exception:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const subscribeToAuthChanges = () => {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session) {
          await AsyncStorage.multiSet([
            ["access_token", session.access_token],
            ["refresh_token", session.refresh_token],
          ]);

          const storedRole = await AsyncStorage.getItem("user_role");
          setRole(storedRole ?? "");
          setSession(session);
          setAuthenticated(true);
        } else {
          setSession(null);
          setAuthenticated(false);
          setRole("");
        }
      });

      authSubscription = subscription;
    };

    restoreSession();
    subscribeToAuthChanges();

    return () => {
      if (authSubscription) authSubscription.unsubscribe();
    };
  }, []);

  return (
    <SessionContext.Provider
      value={{
        isAuthenticated,
        session,
        isLoading,
        role,
        signIn,
        signUp,
        signUpClinic,
        signOut,
        resetPassword, // ✅ Exposed here
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};
