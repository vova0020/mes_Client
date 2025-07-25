// ========================================
// 1. Модуль пользователей
// ========================================

model User {
  userId    Int      @id @default(autoincrement()) @map("user_id")
  login     String   @unique
  password  String // Зашифрованный пароль
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Связи
  userDetail   UserDetail?
  userRoles    UserRole[]
  loginLogs    LoginLog[]
  pickers      Picker[]
  packingTasks PackingTask[] @relation("AssignedUser")

  @@map("users")
}

model UserDetail {
  detailId  Int      @id @default(autoincrement()) @map("detail_id")
  userId    Int      @unique @map("user_id")
  firstName String   @map("first_name")
  lastName  String   @map("last_name")
  phone     String?
  position  String?
  salary    Decimal?

  // Связи
  user User @relation(fields: [userId], references: [userId], onDelete: Cascade)

  @@map("user_details")
}

model Role {
  roleId   Int    @id @default(autoincrement()) @map("role_id")
  roleName String @map("role_name")

  // Связи
  userRoles UserRole[]

  @@map("roles")
}

model UserRole {
  userRoleId Int @id @default(autoincrement()) @map("user_role_id")
  userId     Int @map("user_id")
  roleId     Int @map("role_id")

  // Связи
  user User @relation(fields: [userId], references: [userId], onDelete: Cascade)
  role Role @relation(fields: [roleId], references: [roleId], onDelete: Cascade)

  @@map("user_roles")
}

model LoginLog {
  logId       Int      @id @default(autoincrement()) @map("log_id")
  userId      Int?     @map("user_id")
  ipAddress   String   @map("ip_address")
  deviceInfo  String?  @map("device_info")
  attemptTime DateTime @map("attempt_time")
  success     Boolean

  // Связи
  user User? @relation(fields: [userId], references: [userId])

  @@map("login_logs")
}

// ========================================
// 2. Модуль производства
// ========================================

model Order {
  orderId              Int       @id @default(autoincrement()) @map("order_id")
  batchNumber          String    @map("batch_number")
  orderName            String    @map("order_name")
  completionPercentage Decimal   @map("completion_percentage")
  createdAt            DateTime  @default(now()) @map("created_at")
  completedAt          DateTime? @map("completed_at")
  launchPermission     Boolean   @map("launch_permission")
  isCompleted          Boolean   @map("is_completed")

  // Связи
  packages Package[]

  @@map("orders")
}

model Package {
  packageId            Int     @id @default(autoincrement()) @map("package_id")
  orderId              Int     @map("order_id")
  packageCode          String  @map("package_code")
  packageName          String  @map("package_name")
  completionPercentage Decimal @map("completion_percentage")

  // Связи
  order                  Order                   @relation(fields: [orderId], references: [orderId], onDelete: Cascade)
  productionPackageParts ProductionPackagePart[]

  @@map("packages")
}

model ProductionPackagePart {
  pppId     Int     @id @default(autoincrement()) @map("ppp_id")
  packageId Int     @map("package_id")
  partId    Int     @map("part_id")
  quantity  Decimal

  // Связи
  package Package @relation(fields: [packageId], references: [packageId], onDelete: Cascade)
  part    Part    @relation(fields: [partId], references: [partId], onDelete: Cascade)

  @@map("production_package_parts")
}

enum PartStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
}

model Part {
  partId           Int        @id @default(autoincrement()) @map("part_id")
  partCode         String     @map("part_code")
  partName         String     @map("part_name")
  materialId       Int        @map("material_id")
  size             String
  totalQuantity    Decimal    @map("total_quantity")
  status           PartStatus
  isSubassembly    Boolean    @default(false) @map("is_subassembly")
  routeId          Int        @map("route_id")
  readyForMainFlow Boolean    @default(false) @map("ready_for_main_flow")
  returnStageId    Int?       @map("return_stage_id")

  // Связи
  material               Material                @relation(fields: [materialId], references: [materialId])
  route                  Route                   @relation(fields: [routeId], references: [routeId])
  returnStage            RouteStage?             @relation("ReturnStage", fields: [returnStageId], references: [routeStageId])
  pallets                Pallet[]
  pickerTasks            PickerTask[]
  partRouteProgress      PartRouteProgress[]
  productionPackageParts ProductionPackagePart[]
  packageParts           PackagePart[]
  parentBillOfMaterials  BillOfMaterial[]        @relation("ParentPart")
  childBillOfMaterials   BillOfMaterial[]        @relation("ChildPart")
  subassemblyProgress    SubassemblyProgress[]

  @@map("parts")
}

model BillOfMaterial {
  bomId        Int     @id @default(autoincrement()) @map("bom_id")
  parentPartId Int     @map("parent_part_id")
  childPartId  Int     @map("child_part_id")
  quantity     Decimal

  // Связи
  parentPart Part @relation("ParentPart", fields: [parentPartId], references: [partId], onDelete: Cascade)
  childPart  Part @relation("ChildPart", fields: [childPartId], references: [partId], onDelete: Cascade)

  @@map("bill_of_materials")
}

model Pallet {
  palletId   Int    @id @default(autoincrement()) @map("pallet_id")
  partId     Int    @map("part_id")
  palletName String @map("pallet_name")

  // Связи
  part                Part                  @relation(fields: [partId], references: [partId], onDelete: Cascade)
  palletBufferCells   PalletBufferCell[]
  machineAssignments  MachineAssignment[]
  palletStageProgress PalletStageProgress[]

  @@map("pallets")
}

// ========================================
// 3. Модуль буферов
// ========================================

model Buffer {
  bufferId    Int     @id @default(autoincrement()) @map("buffer_id")
  bufferName  String  @map("buffer_name")
  description String?
  location    String

  // Связи
  bufferCells BufferCell[]

  @@map("buffers")
}

enum CellStatus {
  AVAILABLE
  OCCUPIED
  RESERVED
}

model BufferCell {
  cellId      Int        @id @default(autoincrement()) @map("cell_id")
  bufferId    Int        @map("buffer_id")
  cellCode    String     @map("cell_code")
  status      CellStatus
  capacity    Decimal
  currentLoad Decimal    @map("current_load")
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")

  // Связи
  buffer            Buffer             @relation(fields: [bufferId], references: [bufferId], onDelete: Cascade)
  palletBufferCells PalletBufferCell[]
  pickerTasksFrom   PickerTask[]       @relation("FromCell")
  pickerTasksTo     PickerTask[]       @relation("ToCell")

  @@map("buffer_cells")
}

model PalletBufferCell {
  palletCellId Int       @id @default(autoincrement()) @map("pallet_cell_id")
  palletId     Int       @map("pallet_id")
  cellId       Int       @map("cell_id")
  placedAt     DateTime  @map("placed_at")
  removedAt    DateTime? @map("removed_at")

  // Связи
  pallet Pallet     @relation(fields: [palletId], references: [palletId], onDelete: Cascade)
  cell   BufferCell @relation(fields: [cellId], references: [cellId], onDelete: Cascade)

  @@map("pallets_buffer_cells")
}

// ========================================
// 4. Модуль производственных процессов
// ========================================

model ProductionLine {
  lineId   Int    @id @default(autoincrement()) @map("line_id")
  lineName String @map("line_name")
  lineType String @map("line_type")

  // Связи
  linesStages LineStage[]
  materials   LineMaterial[]

  @@map("production_lines")
}

model ProductionStageLevel1 {
  stageId     Int      @id @default(autoincrement()) @map("stage_id")
  stageName   String   @map("stage_name")
  description String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Связи
  productionStagesLevel2 ProductionStageLevel2[]
  linesStages            LineStage[]
  machinesStages         MachineStage[]
  routeStages            RouteStage[]

  @@map("production_stages_level_1")
}

model ProductionStageLevel2 {
  substageId   Int     @id @default(autoincrement()) @map("substage_id")
  stageId      Int     @map("stage_id")
  substageName String  @map("substage_name")
  description  String?
  allowance    Decimal

  // Связи
  stage       ProductionStageLevel1 @relation(fields: [stageId], references: [stageId], onDelete: Cascade)
  routeStages RouteStage[]

  @@map("production_stages_level_2")
}

model LineStage {
  lineStageId Int @id @default(autoincrement()) @map("line_stage_id")
  lineId      Int @map("line_id")
  stageId     Int @map("stage_id")

  // Связи
  line  ProductionLine        @relation(fields: [lineId], references: [lineId], onDelete: Cascade)
  stage ProductionStageLevel1 @relation(fields: [stageId], references: [stageId], onDelete: Cascade)

  @@map("lines_stages")
}

// ========================================
// 5. Модуль станков
// ========================================

enum MachineStatus {
  ACTIVE
  INACTIVE
  MAINTENANCE
}

model Machine {
  machineId        Int           @id @default(autoincrement()) @map("machine_id")
  machineName      String        @map("machine_name")
  status           MachineStatus
  recommendedLoad  Decimal       @map("recommended_load")
  loadUnit         String        @map("load_unit")
  isTaskChangeable Boolean       @map("is_task_changeable")

  // Связи
  machinesStages     MachineStage[]
  pickerTasks        PickerTask[]
  packingTasks       PackingTask[]
  machineAssignments MachineAssignment[]

  @@map("machines")
}

model MachineStage {
  machineStageId Int @id @default(autoincrement()) @map("machine_stage_id")
  machineId      Int @map("machine_id")
  stageId        Int @map("stage_id")

  // Связи
  machine Machine               @relation(fields: [machineId], references: [machineId], onDelete: Cascade)
  stage   ProductionStageLevel1 @relation(fields: [stageId], references: [stageId], onDelete: Cascade)

  @@map("machines_stages")
}

// ========================================
// 6. Модуль маршрутизации
// ========================================

model Route {
  routeId   Int    @id @default(autoincrement()) @map("route_id")
  routeName String @map("route_name")

  // Связи
  routeStages RouteStage[]
  parts       Part[]

  @@map("routes")
}

model RouteStage {
  routeStageId   Int     @id @default(autoincrement()) @map("route_stage_id")
  routeId        Int     @map("route_id")
  stageId        Int     @map("stage_id")
  substageId     Int?    @map("substage_id")
  sequenceNumber Decimal @map("sequence_number")

  // Связи
  route               Route                  @relation(fields: [routeId], references: [routeId], onDelete: Cascade)
  stage               ProductionStageLevel1  @relation(fields: [stageId], references: [stageId])
  substage            ProductionStageLevel2? @relation(fields: [substageId], references: [substageId])
  partRouteProgress   PartRouteProgress[]
  palletStageProgress PalletStageProgress[]
  subassemblyProgress SubassemblyProgress[]
  returnStageParts    Part[]                 @relation("ReturnStage")

  @@map("route_stages")
}

// ========================================
// 7. Модуль материалов
// ========================================

model MaterialGroup {
  groupId   Int    @id @default(autoincrement()) @map("group_id")
  groupName String @map("group_name")

  // Связи
  groupsMaterials GroupMaterial[]

  @@map("material_groups")
}

model Material {
  materialId   Int    @id @default(autoincrement()) @map("material_id")
  materialName String @map("material_name")
  article      String
  unit         String

  // Связи
  groupsMaterials GroupMaterial[]
  parts           Part[]
  lines          LineMaterial[]

  @@map("materials")
}

model GroupMaterial {
  groupMaterialId Int @id @default(autoincrement()) @map("group_material_id")
  groupId         Int @map("group_id")
  materialId      Int @map("material_id")

  // Связи
  group    MaterialGroup @relation(fields: [groupId], references: [groupId], onDelete: Cascade)
  material Material      @relation(fields: [materialId], references: [materialId], onDelete: Cascade)

  @@map("groups_materials")
}
  
model LineMaterial {
  lineMaterialId Int             @id @default(autoincrement()) @map("line_material_id")
  lineId         Int             @map("line_id")
  materialId     Int             @map("material_id")

  // связи
  line     ProductionLine       @relation(fields: [lineId], references: [lineId], onDelete: Cascade)
  material Material             @relation(fields: [materialId], references: [materialId], onDelete: Cascade)

  @@map("lines_materials")
}

// ========================================
// 8. Модуль комплектовщиков
// ========================================

model Picker {
  pickerId Int  @id @default(autoincrement()) @map("picker_id")
  userId   Int? @map("user_id")

  // Связи
  user        User?        @relation(fields: [userId], references: [userId])
  pickerTasks PickerTask[]

  @@map("pickers")
}

enum TaskStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
}

model PickerTask {
  taskId      Int        @id @default(autoincrement()) @map("task_id")
  pickerId    Int?       @map("picker_id")
  partId      Int        @map("part_id")
  fromCellId  Int?       @map("from_cell_id")
  toCellId    Int?       @map("to_cell_id")
  toMachineId Int?       @map("to_machine_id")
  status      TaskStatus
  assignedAt  DateTime   @map("assigned_at")
  completedAt DateTime?  @map("completed_at")

  // Связи
  picker    Picker?     @relation(fields: [pickerId], references: [pickerId])
  part      Part        @relation(fields: [partId], references: [partId], onDelete: Cascade)
  fromCell  BufferCell? @relation("FromCell", fields: [fromCellId], references: [cellId])
  toCell    BufferCell? @relation("ToCell", fields: [toCellId], references: [cellId])
  toMachine Machine?    @relation(fields: [toMachineId], references: [machineId])

  @@map("picker_tasks")
}

// ========================================
// 9. Модуль упаковки
// ========================================

enum PackageStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
}

model PackingPackage {
  packageId   Int           @id @default(autoincrement()) @map("package_id")
  packageName String        @map("package_name")
  status      PackageStatus
  createdAt   DateTime      @default(now()) @map("created_at")
  completedAt DateTime?     @map("completed_at")

  // Связи
  packingTasks PackingTask[]
  packageParts PackagePart[]

  @@map("packing_packages")
}

model PackagePart {
  packagePartId Int @id @default(autoincrement()) @map("package_part_id")
  packageId     Int @map("package_id")
  partId        Int @map("part_id")

  // Связи
  package PackingPackage @relation(fields: [packageId], references: [packageId], onDelete: Cascade)
  part    Part           @relation(fields: [partId], references: [partId], onDelete: Cascade)

  @@map("package_parts")
}

enum PackingTaskStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  PARTIALLY_COMPLETED
}

model PackingTask {
  taskId      Int               @id @default(autoincrement()) @map("task_id")
  packageId   Int               @map("package_id")
  machineId   Int               @map("machine_id")
  assignedTo  Int?              @map("assigned_to")
  status      PackingTaskStatus
  priority    Decimal
  assignedAt  DateTime          @map("assigned_at")
  completedAt DateTime?         @map("completed_at")

  // Связи
  package      PackingPackage @relation(fields: [packageId], references: [packageId], onDelete: Cascade)
  machine      Machine        @relation(fields: [machineId], references: [machineId])
  assignedUser User?          @relation("AssignedUser", fields: [assignedTo], references: [userId])

  @@map("packing_tasks")
}

// ========================================
// 10. Модуль сборки из полуфабрикатов
// ========================================

enum SubassemblyStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
}

model SubassemblyProgress {
  sapId        Int               @id @default(autoincrement()) @map("sap_id")
  parentPartId Int               @map("parent_part_id")
  routeStageId Int               @map("route_stage_id")
  status       SubassemblyStatus
  completedAt  DateTime?         @map("completed_at")

  // Связи
  parentPart Part       @relation(fields: [parentPartId], references: [partId], onDelete: Cascade)
  routeStage RouteStage @relation(fields: [routeStageId], references: [routeStageId])

  @@map("subassembly_progress")
}

// ========================================
// Дополнительные модели для отслеживания прогресса
// ========================================

model PartRouteProgress {
  prpId        Int        @id @default(autoincrement()) @map("prp_id")
  partId       Int        @map("part_id")
  routeStageId Int        @map("route_stage_id")
  status       TaskStatus
  completedAt  DateTime?  @map("completed_at")

  // Связи
  part       Part       @relation(fields: [partId], references: [partId], onDelete: Cascade)
  routeStage RouteStage @relation(fields: [routeStageId], references: [routeStageId])

  @@map("part_route_progress")
}

model PalletStageProgress {
  pspId        Int        @id @default(autoincrement()) @map("psp_id")
  palletId     Int        @map("pallet_id")
  routeStageId Int        @map("route_stage_id")
  status       TaskStatus
  completedAt  DateTime?  @map("completed_at")

  // Связи
  pallet     Pallet     @relation(fields: [palletId], references: [palletId], onDelete: Cascade)
  routeStage RouteStage @relation(fields: [routeStageId], references: [routeStageId])

  @@map("pallet_stage_progress")
}

model MachineAssignment {
  assignmentId Int       @id @default(autoincrement()) @map("assignment_id")
  machineId    Int       @map("machine_id")
  palletId     Int       @map("pallet_id")
  assignedAt   DateTime  @map("assigned_at")
  completedAt  DateTime? @map("completed_at")

  // Связи
  machine Machine @relation(fields: [machineId], references: [machineId])
  pallet  Pallet  @relation(fields: [palletId], references: [palletId], onDelete: Cascade)

  @@map("machine_assignments")
}
