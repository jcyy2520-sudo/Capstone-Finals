<?php

namespace App\Services;

use App\Models\DocumentVersion;
use App\Models\BlockchainEvent;
use Illuminate\Support\Facades\Storage;

class DocumentRegistryService
{
    /**
     * Register a new document version for an entity.
     */
    public function register($entity, string $documentType, string $filePath, int $userId, ?string $remarks = null): DocumentVersion
    {
        $entityType = get_class($entity);
        $entityId = $entity->id;

        // Mark previous versions as not current
        DocumentVersion::where('entity_type', $entityType)
            ->where('entity_id', $entityId)
            ->where('document_type', $documentType)
            ->where('is_current', true)
            ->update(['is_current' => false]);

        // Compute version number
        $latestVersion = DocumentVersion::where('entity_type', $entityType)
            ->where('entity_id', $entityId)
            ->where('document_type', $documentType)
            ->max('version') ?? 0;

        // Compute file hash and size
        $fileContents = Storage::exists($filePath) ? Storage::get($filePath) : '';
        $fileHash = hash('sha256', $fileContents);
        $fileSize = Storage::exists($filePath) ? Storage::size($filePath) : 0;
        $mimeType = Storage::exists($filePath) ? Storage::mimeType($filePath) : 'application/pdf';

        $version = DocumentVersion::create([
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'document_type' => $documentType,
            'version' => $latestVersion + 1,
            'file_path' => $filePath,
            'file_hash' => $fileHash,
            'file_size' => $fileSize,
            'mime_type' => $mimeType,
            'uploaded_by' => $userId,
            'remarks' => $remarks,
            'is_current' => true,
        ]);

        BlockchainEvent::recordEvent(
            BlockchainEvent::DOCUMENT_REGISTERED,
            $userId,
            $entityType,
            $entityId,
            $fileHash,
            [
                'document_type' => $documentType,
                'version' => $version->version,
                'file_path' => $filePath,
            ]
        );

        return $version;
    }

    /**
     * Get all versions of a document for an entity.
     */
    public function getVersions($entity, string $documentType)
    {
        return DocumentVersion::where('entity_type', get_class($entity))
            ->where('entity_id', $entity->id)
            ->where('document_type', $documentType)
            ->orderByDesc('version')
            ->get();
    }

    /**
     * Get the current version of a document.
     */
    public function getCurrentVersion($entity, string $documentType)
    {
        return DocumentVersion::where('entity_type', get_class($entity))
            ->where('entity_id', $entity->id)
            ->where('document_type', $documentType)
            ->where('is_current', true)
            ->first();
    }

    /**
     * Verify document integrity by re-computing hash.
     */
    public function verifyIntegrity(DocumentVersion $documentVersion): array
    {
        if (!Storage::exists($documentVersion->file_path)) {
            return [
                'valid' => false,
                'reason' => 'File not found on disk.',
                'stored_hash' => $documentVersion->file_hash,
                'computed_hash' => null,
            ];
        }

        $currentHash = hash('sha256', Storage::get($documentVersion->file_path));

        return [
            'valid' => $currentHash === $documentVersion->file_hash,
            'stored_hash' => $documentVersion->file_hash,
            'computed_hash' => $currentHash,
            'version' => $documentVersion->version,
            'document_type' => $documentVersion->document_type,
        ];
    }
}
