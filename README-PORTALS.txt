CUN Admin + Staff Portal upload pack
====================================

Upload these files into your GitHub repo root (overwrite existing):

  admin.html
  staff-portal.html
  js/admin.js
  js/staff.js

What Admin can do
-----------------
- Dashboard stats
- Review / change application status
- Manage user roles
- Create fee for one student
- Bulk-create fees for all students
- Edit fee status / delete fee
- View payments
- View programmes
- Publish/delete news and events
- View audit log

What Staff can do
-----------------
- Dashboard stats
- View courses
- View students
- View pending applications
- Enter grades/results (needs grades table + RLS write policy)
- View fee overview (read-only)

Login
-----
Admin: profile.role = admin  (or admin role in user_roles)
Staff: profile.role = staff  (admin can also open staff portal)

Important Supabase notes
------------------------
1) Admin fee creation needs an INSERT policy on fee_records for admin/staff.
2) If inserts fail, add policies similar to:

  create policy "admin manage fees"
  on public.fee_records for all
  using (public.is_staff() or public.is_admin())
  with check (public.is_staff() or public.is_admin());

3) Grades entry needs INSERT on grades for staff.

4) After upload, hard-refresh or use a private tab.
