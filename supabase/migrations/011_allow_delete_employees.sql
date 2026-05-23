-- Allow deleting employee profiles from the POS UI.
-- Employee shifts already cascade through employee_shifts.employee_id.

alter table public.employees enable row level security;

grant delete on table public.employees to anon, authenticated;

drop policy if exists "Allow anon delete employees" on public.employees;
create policy "Allow anon delete employees"
on public.employees for delete
to anon
using (true);

drop policy if exists "Allow authenticated delete employees" on public.employees;
create policy "Allow authenticated delete employees"
on public.employees for delete
to authenticated
using (true);

create or replace function public.delete_employee_profile(employee_id_to_delete uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    delete from public.employee_shifts
    where employee_id = employee_id_to_delete;

    delete from public.employees
    where id = employee_id_to_delete;
end;
$$;

grant execute on function public.delete_employee_profile(uuid) to anon, authenticated;
