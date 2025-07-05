// Тестовый файл для проверки API упаковок
import { packageDirectoryApi, CreatePackageDirectoryDto, UpdatePackageDirectoryDto } from './packageDirectoryApi';

/**
 * Тестовая функция для проверки всех методов API
 */
export const testPackageDirectoryApi = async () => {
  console.log('=== Тестирование API упаковок ===');
  
  try {
    // 1. Получение всех упаковок
    console.log('\n1. Получение всех упаковок...');
    const allPackages = await packageDirectoryApi.findAll();
    console.log('Получено упаковок:', allPackages.length);
    console.log('Данные:', allPackages);

    // 2. Создание новой упаковки
    console.log('\n2. Создание новой упаковки...');
    const newPackageData: CreatePackageDirectoryDto = {
      packageCode: 'TEST-001',
      packageName: 'Тестовая упаковка'
    };
    
    const createdPackage = await packageDirectoryApi.create(newPackageData);
    console.log('Создана упаковка:', createdPackage);

    // 3. Получение упаковки по ID
    console.log('\n3. Получение упаковки по ID...');
    const packageById = await packageDirectoryApi.findById(createdPackage.packageId);
    console.log('Получена упаковка по ID:', packageById);

    // 4. Обновление упаковки
    console.log('\n4. Обновление упаковки...');
    const updateData: UpdatePackageDirectoryDto = {
      packageName: 'Обновленная тестовая упаковка'
    };
    
    const updatedPackage = await packageDirectoryApi.update(createdPackage.packageId, updateData);
    console.log('Обновлена упаковка:', updatedPackage);

    // 5. Удаление упаковки
    console.log('\n5. Удаление упаковки...');
    const deleteResult = await packageDirectoryApi.remove(createdPackage.packageId);
    console.log('Результат удаления:', deleteResult);

    console.log('\n=== Тестирование завершено успешно ===');
    
  } catch (error) {
    console.error('Ошибка при тестировании API:', error);
  }
};

// Экспортируем для использования в других файлах
export default testPackageDirectoryApi;