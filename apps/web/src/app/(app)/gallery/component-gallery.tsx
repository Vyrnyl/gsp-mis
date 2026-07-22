'use client';

import { useState, type ReactNode } from 'react';

import { AddIcon, ArchiveIcon, DeleteIcon, EditIcon, MembersIcon } from '@/shared/components/icons';
import { PageHeader } from '@/shared/components/layout/page-header';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  CardSkeleton,
  ChartSkeleton,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  FormField,
  Input,
  Modal,
  Pagination,
  PasswordInput,
  SearchInput,
  Select,
  Table,
  TableAvatar,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableSkeleton,
  TableWrapper,
  Textarea,
  ToggleSwitch,
  useToast,
  type BadgeTone,
  type ButtonVariant,
} from '@/shared/components/ui';

const BUTTON_VARIANTS: ButtonVariant[] = ['green', 'outline', 'red', 'gold', 'blue', 'gray'];
const BADGE_TONES: BadgeTone[] = ['green', 'gold', 'blue', 'red', 'gray'];

const SWATCHES = [
  { name: 'brand-green', hex: '#1a6b3c', note: '6.62:1 on white — AA' },
  { name: 'brand-green2', hex: '#2e8b57', note: 'gradient partner' },
  { name: 'brand-green3', hex: '#d4edda', note: 'pale tint / success bg' },
  { name: 'brand-gold', hex: '#c8a900', note: 'decorative only — never text' },
  { name: 'brand-gold2', hex: '#f0d000', note: 'accents, chart segment' },
  { name: 'brand-gold-ink', hex: '#8a7500', note: '4.54:1 — the only gold for white text' },
  { name: 'brand-blue', hex: '#1565c0', note: 'info accent' },
  { name: 'brand-red', hex: '#c0392b', note: 'danger accent' },
  { name: 'muted', hex: '#6c757d', note: '4.76:1 — replaces every #aaa' },
  { name: 'ink', hex: '#212529', note: 'primary text' },
  { name: 'canvas', hex: '#f4f6f0', note: 'app background' },
];

const SAMPLE_MEMBERS = [
  { name: 'Althea Ramos', troop: 'Troop 12 — Virac', level: 'Senior', status: 'Active' },
  { name: 'Bea Delfin', troop: 'Troop 4 — Bato', level: 'Junior', status: 'Pending' },
  { name: 'Cristina Ople', troop: 'Troop 12 — Virac', level: 'Cadet', status: 'Expiring' },
  { name: 'Dana Villar', troop: 'Troop 7 — San Andres', level: 'Senior', status: 'Archived' },
];

const STATUS_TONE: Record<string, BadgeTone> = {
  Active: 'green',
  Pending: 'gold',
  Expiring: 'blue',
  Archived: 'gray',
};

function Section({
  id,
  title,
  note,
  children,
}: {
  id: string;
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mb-8 scroll-mt-24">
      <Card>
        <CardHeader as="h3" title={title} subtitle={note} />
        {children}
      </Card>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 last:mb-0">
      <p className="mb-2 text-[0.78rem] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

/**
 * Phase 0.2 verification surface: every base component in every variant and state.
 *
 * This page is the visual-verify gate for the design-system port. It is a
 * development surface, not a product screen — it does not ship in any role's nav
 * once Phase 1 wires real navigation.
 */
export function ComponentGallery() {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const handleConfirm = () => {
    setIsConfirming(true);
    setTimeout(() => {
      setIsConfirming(false);
      setIsConfirmOpen(false);
      showToast('Member archived.', 'success');
    }, 900);
  };

  return (
    <>
      <PageHeader
        title="Component Gallery"
        description="Phase 0.2 — every base component in every variant and state. Verify at 900px, 768px and 480px."
      />

      <Section
        id="tokens"
        title="Design tokens"
        note="Ported from the prototype with the two WCAG failures corrected (ui-rules.md §9)."
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg2:grid-cols-4">
          {SWATCHES.map((swatch) => (
            <div key={swatch.name} className="rounded-card border border-hairline-subtle p-3">
              <div
                className="mb-2 h-12 rounded-control border border-black/5"
                style={{ background: swatch.hex }}
              />
              <p className="text-[0.8rem] font-semibold text-ink">{swatch.name}</p>
              <p className="font-mono text-[0.72rem] text-muted">{swatch.hex}</p>
              <p className="mt-1 text-[0.72rem] leading-snug text-muted">{swatch.note}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        id="buttons"
        title="Buttons"
        note="Registry §6 — .btn, .btn-sm and every colour variant."
      >
        <Row label="Variants (medium)">
          {BUTTON_VARIANTS.map((variant) => (
            <Button key={variant} variant={variant}>
              {variant}
            </Button>
          ))}
        </Row>
        <Row label="Small">
          {BUTTON_VARIANTS.map((variant) => (
            <Button key={variant} variant={variant} size="sm">
              {variant}
            </Button>
          ))}
        </Row>
        <Row label="With icons">
          <Button leadingIcon={<AddIcon />}>Register member</Button>
          <Button variant="outline" leadingIcon={<EditIcon />}>
            Edit
          </Button>
          <Button variant="gray" size="sm" leadingIcon={<ArchiveIcon />}>
            Archive
          </Button>
          <Button variant="red" size="sm" leadingIcon={<DeleteIcon />}>
            Delete
          </Button>
        </Row>
        <Row label="Loading & disabled">
          <Button isLoading>Saving…</Button>
          <Button variant="outline" isLoading>
            Loading
          </Button>
          <Button disabled>Disabled</Button>
          <Button variant="outline" disabled>
            Disabled
          </Button>
        </Row>
        <Row label="Primary (auth only — full width)">
          <div className="w-full max-w-sm">
            <Button variant="primary">Log In</Button>
          </div>
        </Row>
      </Section>

      <Section id="badges" title="Badges & alerts" note="Registry §1 and §7.">
        <Row label="Status pills">
          {BADGE_TONES.map((tone) => (
            <Badge key={tone} tone={tone}>
              {tone}
            </Badge>
          ))}
        </Row>
        <div className="mt-4">
          <p className="mb-2 text-[0.78rem] font-semibold uppercase tracking-wide text-muted">
            Alerts — form and auth messages
          </p>
          <Alert tone="error">Invalid email or password. Please try again.</Alert>
          <Alert tone="success">Member registered successfully.</Alert>
          <Alert tone="info">Membership renewals for 2026 open on 1 August.</Alert>
          <Alert tone="warning">Three memberships in this troop expire within 30 days.</Alert>
        </div>
      </Section>

      <Section
        id="forms"
        title="Form controls"
        note="Registry §5 and §9 — label, hint, error and disabled states."
      >
        <div className="grid gap-x-5 lg2:grid-cols-2">
          <FormField label="Full name" required hint="As it appears on the birth certificate.">
            <Input placeholder="Althea Ramos" />
          </FormField>

          <FormField label="Email address" error="Enter a valid email address.">
            <Input type="email" defaultValue="althea@" />
          </FormField>

          <FormField label="Password" hint="At least 8 characters.">
            <PasswordInput placeholder="••••••••" />
          </FormField>

          <FormField label="Scout level" required>
            <Select
              placeholder="Select a level"
              defaultValue=""
              options={[
                { value: 'twinkler', label: 'Twinkler' },
                { value: 'star', label: 'Star Scout' },
                { value: 'junior', label: 'Junior' },
                { value: 'senior', label: 'Senior' },
                { value: 'cadet', label: 'Cadet' },
              ]}
            />
          </FormField>

          <FormField label="Notes">
            <Textarea placeholder="Anything the troop leader should know…" />
          </FormField>

          <div>
            <FormField label="Troop (read-only)" hint="Assigned by the council.">
              <Input defaultValue="Troop 12 — Virac" disabled />
            </FormField>

            <p className="mb-2 text-[0.78rem] font-semibold uppercase tracking-wide text-muted">
              Search input
            </p>
            <SearchInput
              label="Search members"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onClear={() => setSearch('')}
              className="mb-5"
            />

            <p className="mb-2 text-[0.78rem] font-semibold uppercase tracking-wide text-muted">
              Toggles
            </p>
            <div className="space-y-3">
              <ToggleSwitch label="Email notifications" defaultChecked />
              <ToggleSwitch label="SMS reminders" />
              <ToggleSwitch label="Disabled setting" disabled />
            </div>
          </div>
        </div>
      </Section>

      <Section
        id="table"
        title="Table — populated"
        note="Registry §3 + §9 pagination. Scrolls horizontally rather than reflowing."
      >
        <TableWrapper aria-label="Sample member table">
          <Table caption="Sample members used to verify table styling">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Member</TableHeaderCell>
                <TableHeaderCell>Troop</TableHeaderCell>
                <TableHeaderCell>Level</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {SAMPLE_MEMBERS.map((member) => (
                <TableRow key={member.name}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <TableAvatar name={member.name} />
                      <span className="font-semibold">{member.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{member.troop}</TableCell>
                  <TableCell>{member.level}</TableCell>
                  <TableCell>
                    <Badge tone={STATUS_TONE[member.status] ?? 'gray'}>{member.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                      <Button size="sm" variant="gray" onClick={() => setIsConfirmOpen(true)}>
                        Archive
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrapper>
        <Pagination
          className="mt-4"
          page={page}
          pageSize={10}
          totalItems={1240}
          itemLabel="members"
          onPageChange={setPage}
        />
      </Section>

      <Section
        id="states"
        title="Loading, empty and error states"
        note="Required on every screen by the Definition of Done. The prototype has none of these."
      >
        <p className="mb-2 text-[0.78rem] font-semibold uppercase tracking-wide text-muted">
          Table skeleton
        </p>
        <TableSkeleton rows={4} columns={5} />

        <div className="mt-6 grid gap-5 lg2:grid-cols-2">
          <div>
            <p className="mb-2 text-[0.78rem] font-semibold uppercase tracking-wide text-muted">
              Card skeleton
            </p>
            <div className="rounded-card border border-hairline-subtle p-5">
              <CardSkeleton />
            </div>
          </div>
          <div>
            <p className="mb-2 text-[0.78rem] font-semibold uppercase tracking-wide text-muted">
              Chart skeleton
            </p>
            <div className="rounded-card border border-hairline-subtle p-5">
              <ChartSkeleton height={120} />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg2:grid-cols-2">
          <div>
            <p className="mb-2 text-[0.78rem] font-semibold uppercase tracking-wide text-muted">
              Empty state
            </p>
            <div className="rounded-card border border-hairline-subtle">
              <EmptyState
                icon={MembersIcon}
                title="No members yet"
                description="Once registrations come in they will appear here."
                action={<Button leadingIcon={<AddIcon />}>Register the first member</Button>}
              />
            </div>
          </div>
          <div>
            <p className="mb-2 text-[0.78rem] font-semibold uppercase tracking-wide text-muted">
              Error state
            </p>
            <ErrorState
              description="We could not load the membership registry."
              onRetry={() => showToast('Retrying…', 'info')}
            />
          </div>
        </div>
      </Section>

      <Section
        id="overlays"
        title="Overlays & toasts"
        note="Registry §7 — focus-trapped, Escape-dismissible, scroll-locked."
      >
        <Row label="Triggers">
          <Button onClick={() => setIsModalOpen(true)}>Open modal</Button>
          <Button variant="red" onClick={() => setIsConfirmOpen(true)}>
            Destructive action
          </Button>
          <Button variant="outline" onClick={() => showToast('Member saved.', 'success')}>
            Success toast
          </Button>
          <Button variant="outline" onClick={() => showToast('Could not save member.', 'error')}>
            Error toast
          </Button>
          <Button variant="outline" onClick={() => showToast('Export started.', 'info')}>
            Info toast
          </Button>
        </Row>
      </Section>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register member"
        footer={
          <>
            <Button variant="gray" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setIsModalOpen(false);
                showToast('Member registered.', 'success');
              }}
            >
              Save member
            </Button>
          </>
        }
      >
        <div className="grid gap-x-3 md:grid-cols-2">
          <FormField label="First name" required>
            <Input placeholder="Althea" />
          </FormField>
          <FormField label="Last name" required>
            <Input placeholder="Ramos" />
          </FormField>
        </div>
        <FormField label="Email address">
          <Input type="email" placeholder="althea@example.com" />
        </FormField>
        <FormField label="Notes" hint="Optional.">
          <Textarea rows={3} />
        </FormField>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Archive member?"
        description="Althea Ramos will be moved to the archive and hidden from the active registry. You can restore her at any time."
        confirmLabel="Archive member"
        tone="danger"
        isConfirming={isConfirming}
        onConfirm={handleConfirm}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </>
  );
}
