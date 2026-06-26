alter table public.order_items
    add column if not exists line_type text not null default 'standard'
        check (line_type in ('standard', 'combo_parent', 'combo_component'));

alter table public.order_items
    add column if not exists parent_order_item_id uuid references public.order_items(id) on delete cascade;

alter table public.order_items
    add column if not exists sort_index int4 not null default 0;

create index if not exists idx_order_items_parent_order_item_id
    on public.order_items(parent_order_item_id);

create index if not exists idx_order_items_order_sort
    on public.order_items(order_id, sort_index, created_at);
