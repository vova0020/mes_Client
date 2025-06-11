// ================================================
// src/modules/materials/MaterialSettingsPage.tsx
// ================================================
import React, { useState } from 'react';
import { MaterialGroups } from './components/MaterialGroups';
import { MaterialsList } from './components/MaterialsList';
import { MaterialForm } from './components/MaterialForm';
import { GroupLinker } from './components/GroupLinker';
import styles from './MaterialSettings.module.css';

export const MaterialSettingsPage: React.FC = () => {
  const [selectedGroup, setSelectedGroup] = useState<number>();
  const [editMaterialId, setEditMaterialId] = useState<number>();

  const handleGroupSelect = (groupId: number) => {
    setSelectedGroup(groupId);
  };

  const handleMaterialEdit = (materialId: number) => {
    setEditMaterialId(materialId);
  };

  const handleMaterialSaved = () => {
    setEditMaterialId(undefined);
    // Можно добавить логику обновления списков
  };

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Настройки материалов</h1>
      
      <div className={styles.gridContainer}>
        <MaterialGroups onGroupSelect={handleGroupSelect} />
        <GroupLinker />
      </div>
      
      <div className={styles.gridContainer}>
        <MaterialsList 
          filterGroupId={selectedGroup} 
          onMaterialEdit={handleMaterialEdit}
        />
        <MaterialForm 
          editId={editMaterialId} 
          onSaved={handleMaterialSaved} 
        />
      </div>
    </div>
  );
};