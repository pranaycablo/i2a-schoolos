import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Info,
  Trash2,
  Send,
  Plus,
  Search,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Settings
} from 'lucide-react';
import {
  Button,
  IconButton,
  Input,
  Textarea,
  Select,
  SearchableSelect,
  Checkbox,
  Radio,
  Switch,
  FormField,
  ValidationMessage,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  SectionContainer,
  Badge,
  StatusIndicator,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Pagination,
  Tabs,
  TabList,
  TabTrigger,
  TabContent,
  Breadcrumbs,
  Modal,
  ConfirmDialog,
  LoadingSpinner,
  Skeleton,
  EmptyState,
  ErrorState,
  Avatar,
  SearchBar,
  PageHeader,
  PageContainer,
  useToast
} from '../design-system';

export const DesignSystemShowcase: React.FC = () => {
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('buttons');
  const [inputText, setInputText] = useState('Rahul Sharma');
  const [inputError, setInputError] = useState('');
  const [selectVal, setSelectVal] = useState('CBSE');
  const [searchSelectVal, setSearchSelectVal] = useState('patna');
  const [isChecked, setIsChecked] = useState(true);
  const [selectedRadio, setSelectedRadio] = useState('option1');
  const [isSwitchOn, setIsSwitchOn] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchBarValue, setSearchBarValue] = useState('');

  const sampleTableData = [
    { id: '101', name: 'Aarav Kumar', class: 'Class X-A', roll: '01', status: 'ACTIVE', fee: 'PAID' },
    { id: '102', name: 'Diya Patel', class: 'Class X-A', roll: '02', status: 'ACTIVE', fee: 'PENDING' },
    { id: '103', name: 'Ishaan Verma', class: 'Class X-B', roll: '01', status: 'ACTIVE', fee: 'PAID' },
    { id: '104', name: 'Kavya Singh', class: 'Class IX-A', roll: '14', status: 'INACTIVE', fee: 'OVERDUE' },
  ];

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        title="i2A SchoolOS Design System"
        subtitle="Apple-grade visual foundation, unified design tokens & accessible component library"
        badge={
          <Badge variant="brand" size="md">
            v1.2 Tokens Active
          </Badge>
        }
        breadcrumbs={[
          { label: 'Overview' },
          { label: 'System & Architecture' },
          { label: 'Design System' }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                addToast({
                  type: 'info',
                  title: 'System Token Audit',
                  message: '100% of tokens aligned with WCAG 2.1 AA accessibility standards.',
                });
              }}
            >
              Verify Accessibility
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Sparkles className="h-4 w-4" />}
              onClick={() => {
                addToast({
                  type: 'success',
                  title: 'Design Foundation Ready',
                  message: 'Design token system and components active across all modules.',
                });
              }}
            >
              Design Tokens Active
            </Button>
          </div>
        }
      />

      {/* Main Tabbed Showcase */}
      <Tabs activeTab={activeTab} onTabChange={setActiveTab} variant="pills">
        <TabList>
          <TabTrigger value="buttons">Buttons & Icons</TabTrigger>
          <TabTrigger value="forms">Form Controls</TabTrigger>
          <TabTrigger value="data">Tables & Badges</TabTrigger>
          <TabTrigger value="dialogs">Modals & Feedback</TabTrigger>
          <TabTrigger value="typography">Typography & Tokens</TabTrigger>
        </TabList>

        {/* 1. BUTTONS TAB */}
        <TabContent value="buttons" className="space-y-6">
          <SectionContainer
            title="Button Variants & Sizes"
            description="High-contrast, keyboard-focusable buttons with loading & disabled states"
          >
            <Card>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Visual Variants
                  </h4>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="primary">Primary Button</Button>
                    <Button variant="secondary">Secondary Button</Button>
                    <Button variant="outline">Outline Button</Button>
                    <Button variant="ghost">Ghost Button</Button>
                    <Button variant="danger">Danger Action</Button>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Size Scale
                  </h4>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button size="sm">Small (sm)</Button>
                    <Button size="md">Medium (md)</Button>
                    <Button size="lg">Large (lg)</Button>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    States & Icons
                  </h4>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button leftIcon={<Plus className="h-4 w-4" />}>Add Student</Button>
                    <Button rightIcon={<Send className="h-4 w-4" />} variant="secondary">
                      Dispatch
                    </Button>
                    <Button isLoading>Processing...</Button>
                    <Button disabled>Disabled Action</Button>
                    <IconButton icon={<Trash2 className="h-4 w-4" />} aria-label="Delete item" variant="danger" />
                    <IconButton icon={<Settings className="h-4 w-4" />} aria-label="Settings" variant="outline" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </SectionContainer>
        </TabContent>

        {/* 2. FORMS TAB */}
        <TabContent value="forms" className="space-y-6">
          <SectionContainer
            title="Form Inputs & Data Entry"
            description="Accessible input fields with clear validation, helper text, and Hindi text support"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader title="Text Inputs & Textareas" />
                <CardContent className="space-y-4">
                  <Input
                    label="Full Name (English)"
                    required
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    helperText="As printed on government birth certificate"
                  />
                  <Input
                    label="Validated Input with Error"
                    value={inputError}
                    onChange={(e) => setInputError(e.target.value)}
                    error={!inputError ? 'This field cannot be empty' : undefined}
                    placeholder="Type to clear error..."
                  />
                  <Textarea
                    label="Remarks & Counselor Notes"
                    rows={3}
                    placeholder="Enter confidential institutional notes..."
                    helperText="Stored with DPDP Act-compliant field encryption"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader title="Selects, Toggles & Radios" />
                <CardContent className="space-y-4">
                  <Select
                    label="Board Affiliation"
                    value={selectVal}
                    onChange={(e) => setSelectVal(e.target.value)}
                    options={[
                      { value: 'CBSE', label: 'Central Board of Secondary Education (CBSE)' },
                      { value: 'ICSE', label: 'Council for the Indian School Certificate (CISCE/ICSE)' },
                      { value: 'STATE_BOARD', label: 'State Board of Education' },
                      { value: 'IB', label: 'International Baccalaureate (IB)' }
                    ]}
                  />

                  <SearchableSelect
                    label="Campus / Branch Location (Searchable)"
                    value={searchSelectVal}
                    onChange={setSearchSelectVal}
                    options={[
                      { value: 'patna', label: 'Patna Main Campus — Bailey Road' },
                      { value: 'ranchi', label: 'Ranchi South Branch — Morabadi' },
                      { value: 'varanasi', label: 'Varanasi City Branch — Cantt' },
                      { value: 'lucknow', label: 'Lucknow Gomti Nagar Campus' }
                    ]}
                  />

                  <div className="pt-2 space-y-3">
                    <Checkbox
                      checked={isChecked}
                      onChange={(e) => setIsChecked(e.target.checked)}
                      label="Automated SMS & WhatsApp Alerts"
                      description="Send immediate payment and attendance alerts to registered parent mobile"
                    />

                    <div className="space-y-1.5 pt-1">
                      <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Academic Cycle
                      </span>
                      <div className="flex gap-4">
                        <Radio
                          name="academicCycle"
                          checked={selectedRadio === 'option1'}
                          onChange={() => setSelectedRadio('option1')}
                          label="Yearly (April–March)"
                        />
                        <Radio
                          name="academicCycle"
                          checked={selectedRadio === 'option2'}
                          onChange={() => setSelectedRadio('option2')}
                          label="Biannual Semester"
                        />
                      </div>
                    </div>

                    <div className="pt-1">
                      <Switch
                        checked={isSwitchOn}
                        onChange={setIsSwitchOn}
                        label="Two-Factor SMS Verification for Admin"
                        description="Require OTP for fee concessions and attendance overrides"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </SectionContainer>
        </TabContent>

        {/* 3. DATA & TABLES TAB */}
        <TabContent value="data" className="space-y-6">
          <SectionContainer
            title="Data Tables, Badges & Indicators"
            description="Responsive, accessible tabular layouts with status indicators and pagination"
          >
            <Card>
              <CardHeader
                title="Student SIS Records"
                subtitle="Showing Class X active student enrollment"
                action={
                  <div className="flex items-center gap-2">
                    <Badge variant="success" dot>4 Active Records</Badge>
                  </div>
                }
              />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admission No</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Class & Section</TableHead>
                    <TableHead>Roll No</TableHead>
                    <TableHead>SIS Status</TableHead>
                    <TableHead>Fee Account</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sampleTableData.map((row) => (
                    <TableRow key={row.id} interactive>
                      <TableCell className="font-semibold text-indigo-600 dark:text-indigo-400">
                        STD-{row.id}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                        {row.name}
                      </TableCell>
                      <TableCell>{row.class}</TableCell>
                      <TableCell>{row.roll}</TableCell>
                      <TableCell>
                        <Badge variant={row.status === 'ACTIVE' ? 'success' : 'neutral'} size="sm">
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={row.fee === 'PAID' ? 'brand' : row.fee === 'PENDING' ? 'warning' : 'danger'}
                          size="sm"
                        >
                          {row.fee}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination
                currentPage={currentPage}
                totalPages={3}
                totalItems={12}
                onPageChange={setCurrentPage}
                pageSize={4}
              />
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardHeader title="Badge Palette" />
                <CardContent className="flex flex-wrap gap-2">
                  <Badge variant="neutral">Neutral</Badge>
                  <Badge variant="brand">Brand / Primary</Badge>
                  <Badge variant="success" dot>Success Active</Badge>
                  <Badge variant="warning" dot>Warning Pending</Badge>
                  <Badge variant="danger" dot>Danger Overdue</Badge>
                  <Badge variant="purple">AI Assistant</Badge>
                  <Badge variant="cyan">Consortium</Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader title="Realtime Status Indicators" />
                <CardContent className="space-y-3">
                  <div><StatusIndicator status="online" label="MongoDB Database Replica Set (rs0)" /></div>
                  <div><StatusIndicator status="pending" label="Synchronizing Attendance Locks..." /></div>
                  <div><StatusIndicator status="away" label="Idle Backup Worker" /></div>
                  <div><StatusIndicator status="busy" label="Locked Daily Roster" /></div>
                  <div><StatusIndicator status="offline" label="Legacy Database (Quarantined)" /></div>
                </CardContent>
              </Card>
            </div>
          </SectionContainer>
        </TabContent>

        {/* 4. DIALOGS & FEEDBACK TAB */}
        <TabContent value="dialogs" className="space-y-6">
          <SectionContainer
            title="Modals, Toasts & Feedback States"
            description="Accessible focus-trapping dialogs, asynchronous toasts, and loading skeletons"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Card>
                <CardHeader title="Dialog Controls" />
                <CardContent className="space-y-3">
                  <p className="text-xs text-slate-500">
                    Modals support keyboard ESC dismissal, focus trapping, and backdrop blur.
                  </p>
                  <div className="flex flex-wrap gap-2.5 pt-2">
                    <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
                      Open Standard Modal
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => setIsConfirmOpen(true)}>
                      Open Confirm Dialog
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader title="Toast Notification Triggers" />
                <CardContent className="space-y-3">
                  <p className="text-xs text-slate-500">
                    Non-blocking toasts with auto-dismissal and ARIA live regions.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addToast({ type: 'success', title: 'Payment Recorded', message: 'Digital fee receipt generated.' })}
                    >
                      Success Toast
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addToast({ type: 'error', title: 'Authorization Denied', message: 'Cross-tenant access rejected.' })}
                    >
                      Error Toast
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addToast({ type: 'warning', title: 'Lock Approaching', message: 'Daily attendance locks in 15 mins.' })}
                    >
                      Warning Toast
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Card>
                <CardHeader title="Loading Skeletons" />
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton variant="circular" width={40} height={40} />
                    <div className="flex-1 space-y-1">
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="40%" />
                    </div>
                  </div>
                  <Skeleton variant="rectangular" height={60} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader title="Inline Validation Messages" />
                <CardContent className="space-y-2.5">
                  <ValidationMessage type="info" message="Academic Session 2026-2027 is active for new admissions." />
                  <ValidationMessage type="warning" message="3 students have pending transport route fee installments." />
                  <ValidationMessage type="error" message="Aadhaar number format is invalid. Must be 12 digits." />
                  <ValidationMessage type="success" message="Bank reconciliation completed with zero variance." />
                </CardContent>
              </Card>
            </div>

            <EmptyState
              title="No Academic Transcripts Generated Yet"
              description="Final examination papers for Term 1 are currently in teacher review. Report cards will appear here once approved."
              actionLabel="Create Exam Schedule"
              onAction={() => addToast({ type: 'info', title: 'Navigating', message: 'Opening Examination Engine...' })}
            />
          </SectionContainer>
        </TabContent>

        {/* 5. TYPOGRAPHY & TOKENS TAB */}
        <TabContent value="typography" className="space-y-6">
          <SectionContainer
            title="Typography & Internationalization"
            description="Precise type hierarchy with native line-height support for English and Hindi (Devanagari)"
          >
            <Card>
              <CardHeader title="Bilingual Text Scale (English & Hindi)" />
              <CardContent className="space-y-5">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Display Scale</span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                    Empowering Modern Educational Excellence
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold text-slate-700 dark:text-slate-300 mt-1 font-hindi">
                    आधुनिक शैक्षणिक उत्कृष्टता और सर्वांगीण विकास
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Page Title</span>
                  <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                    Comprehensive School Operations & Management
                  </div>
                  <div className="text-base sm:text-lg font-bold text-slate-700 dark:text-slate-300 mt-0.5 font-hindi">
                    समग्र विद्यालय संचालन एवं संस्थागत प्रबंधन प्रणाली
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Body Text & Instructions</span>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    i2A SchoolOS guarantees zero-bypass tenant isolation, cryptographic audit trails, and DPDP Act-compliant privacy protection across all student and guardian interactions.
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 font-hindi">
                    i2A SchoolOS सभी विद्यार्थियों और अभिभावकों के डेटा को उच्चतम सुरक्षा, पारदर्शी ऑडिट प्रणाली और डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम के अनुरूप सुरक्षित रखता है।
                  </p>
                </div>
              </CardContent>
            </Card>
          </SectionContainer>
        </TabContent>
      </Tabs>

      {/* Demo Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Student Registration Dialog"
        description="Standard modal dialog with accessible ESC key and backdrop click support."
      >
        <div className="space-y-4">
          <Input label="Student Name" placeholder="e.g. Priyanshu Roy" />
          <Input label="Admission Number" placeholder="e.g. 2026-ADM-049" />
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setIsModalOpen(false);
                addToast({ type: 'success', title: 'Student Registered', message: 'Record created in synthetic test database.' });
              }}
            >
              Confirm Registration
            </Button>
          </div>
        </div>
      </Modal>

      {/* Demo Confirm Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          setIsConfirmOpen(false);
          addToast({ type: 'error', title: 'Record Purged', message: 'Demonstration action executed.' });
        }}
        title="Delete Academic Record?"
        message="Are you sure you want to delete this record? This action cannot be reversed and will be recorded in the forensic audit trail."
        confirmText="Yes, Delete Record"
        variant="danger"
      />
    </PageContainer>
  );
};
