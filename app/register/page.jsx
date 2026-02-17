"use client";

import { useState , useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {swalSuccess , swalError} from "../components/Swal"

export default function RegisterPage() {
  const router = useRouter();
  const [passwordError, setPasswordError] = useState("");
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usernameError, setUsernameError] = useState("");


  useEffect(() => {
    if (!form.confirmPassword) {
      setPasswordError("");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setPasswordError("Passwords do not match");
    } else {
      setPasswordError("");
    }
  }, [form.password, form.confirmPassword]);

  useEffect(() => {
    if (!form.username.trim()) {
      setUsernameError("");
      return;
    }

    const timeout = setTimeout(async () => {
      const res = await fetch("/api/check-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.username }),
      });

      const data = await res.json();

      if (data.exists) {
        setUsernameError("Username already taken");
      } else {
        setUsernameError("");
      }
    }, 500); // debounce 500ms

    return () => clearTimeout(timeout);
  }, [form.username]);


  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.username.trim()) {
      return setError("Please enter username");
    }

    if (!form.first_name.trim() || !form.last_name.trim()) {
      return setError("Please enter first and last name");
    }

    if (form.password.length < 4) {
      return setError("Password must be at least 4 characters");
    }

    if (form.password !== form.confirmPassword) {
      return setError("Passwords do not match");
    }

    try {
      setLoading(true);

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username.trim(),
          password: form.password,
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Register failed");
      }

      swalSuccess("Register success. Waiting for admin approval.");
      router.push("/login");

    } catch (err) {
      setError(err.message);
      swalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-800">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-[400px]">

        <div className="flex justify-center mb-4">
          <Image
            src="/logo/HANUMAN WORLD.png"
            alt="Hanuman World"
            width={80}
            height={80}
          />
        </div>

        <h2 className="text-2xl font-bold text-center mb-6">
          Register Staff
        </h2>

        <form onSubmit={handleRegister} className="space-y-4">

          <input
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={(e) =>
              setForm({ ...form, username: e.target.value })
            }
            className="w-full border px-3 py-2 rounded-lg"
          />

          {usernameError && (
            <div className="text-red-500 text-sm text-center">
              {usernameError}
            </div>
          )}


          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="First Name"
              value={form.first_name}
              onChange={(e) =>
                setForm({ ...form, first_name: e.target.value })
              }
              className="border px-3 py-2 rounded-lg"
            />

            <input
              type="text"
              placeholder="Last Name"
              value={form.last_name}
              onChange={(e) =>
                setForm({ ...form, last_name: e.target.value })
              }
              className="border px-3 py-2 rounded-lg"
            />
          </div>

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
            className="w-full border px-3 py-2 rounded-lg"
          />

          <input
            type="password"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={(e) =>
              setForm({ ...form, confirmPassword: e.target.value })
            }
            className="w-full border px-3 py-2 rounded-lg"
          />

          {passwordError && (
            <div className="text-red-500 text-sm text-center">
              {passwordError}
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm text-center">
              {error}
            </div>
          )}


          <button
            type="submit"
            disabled={loading || passwordError || usernameError}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Registering..." : "Register"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/login")}
            className="w-full text-sm text-gray-500 hover:underline"
          >
            Back to Login
          </button>

        </form>
      </div>
    </div>
  );
}
