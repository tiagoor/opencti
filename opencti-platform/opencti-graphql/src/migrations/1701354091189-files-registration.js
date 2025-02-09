import * as R from 'ramda';
import { executionContext, SYSTEM_USER } from '../utils/access';
import { loadedFilesListing } from '../database/file-storage';
import { logApp } from '../config/conf';
import { buildFileDataForIndexing } from '../modules/internal/document/document-domain';
import { elIndexElements, MAX_BULK_OPERATIONS } from '../database/engine';
import { INDEX_INTERNAL_OBJECTS } from '../database/utils';

export const up = async (next) => {
  const context = executionContext('migration');
  logApp.info('[MIGRATION] Starting 1701354091161-files-registration.js');
  const files = await loadedFilesListing(SYSTEM_USER, '', { recursive: true });
  logApp.info(`[MIGRATION] ${files.length} files to register in index`);
  const elements = files.map((file) => {
    return { _index: INDEX_INTERNAL_OBJECTS, ...buildFileDataForIndexing(file) };
  });
  let currentBulkUpdateCount = 0;
  const elementsBulk = R.splitEvery(MAX_BULK_OPERATIONS, elements);
  for (let index = 0; index < elementsBulk.length; index += 1) {
    const indexElements = elementsBulk[index];
    await elIndexElements(context, SYSTEM_USER, 'Migration files registration', indexElements);
    currentBulkUpdateCount += indexElements.length;
    logApp.info(`[MIGRATION] files-registration bulk files ${currentBulkUpdateCount} / ${elements.length}`);
  }
  logApp.info('[MIGRATION] Done 1701354091161-files-registration.js');
  next();
};

export const down = async (next) => {
  next();
};
