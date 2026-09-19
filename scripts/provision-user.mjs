#!/usr/bin/env node
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,31}$/;
const DOMAIN = "english-sylvan.local";

function usage() {
  console.error("Usage: npm run provision:user -- --username <name> --password <password> [--display-name <name>]");
  process.exit(1);
}

function readArg(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? "" : process.argv[index + 1] ?? "";
}

const username = readArg("--username").trim().toLowerCase();
const password = readArg("--password");
const displayName = readArg("--display-name").trim() || username;
const url = process.env.SUPABASE_URL?.trim();
const adminKey = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!USERNAME_PATTERN.test(username) || password.length < 6 || !url || !adminKey) usage();

const supabase = createClient(url, adminKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { error: allowlistError } = await supabase
  .from("allowed_usernames")
  .upsert({ username, display_name: displayName, is_active: true }, { onConflict: "username" });
if (allowlistError) throw new Error(`Allowlist update failed: ${allowlistError.message}`);

const email = `${username}@${DOMAIN}`;
const userPayload = {
  email,
  password,
  email_confirm: true,
  user_metadata: { username, display_name: displayName },
};

const { data, error } = await supabase.auth.admin.createUser(userPayload);
let user = data?.user ?? null;

if (error) {
  if (!error.message.toLowerCase().includes("already been registered")) {
    throw new Error(`Auth user creation failed: ${error.message}`);
  }

  const { data: users, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw new Error(`Existing user lookup failed: ${listError.message}`);
  user = users.users.find((candidate) => candidate.email?.toLowerCase() === email);
  if (!user) throw new Error("The username exists, but its internal Auth email could not be found.");

  const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(user.id, userPayload);
  if (updateError) throw new Error(`Existing user update failed: ${updateError.message}`);
  user = updated.user;
  console.log(`Updated existing username: ${username}`);
} else {
  console.log(`Provisioned username: ${username}`);
}

console.log(`Supabase user id: ${user.id}`);
