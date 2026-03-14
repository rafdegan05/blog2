import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: getEnv("AWS_S3_REGION"),
      credentials: {
        accessKeyId: getEnv("AWS_ACCESS_KEY_ID"),
        secretAccessKey: getEnv("AWS_SECRET_ACCESS_KEY"),
      },
    });
  }
  return _client;
}

function getBucket(): string {
  return getEnv("AWS_S3_BUCKET");
}

/**
 * Upload a file buffer to S3.
 * @returns The S3 object key (e.g. "uploads/images/1234-abc.jpg")
 */
export async function uploadToS3(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return key;
}

/**
 * Get a file from S3 as a Buffer.
 */
export async function getFromS3(key: string): Promise<{ buffer: Buffer; contentType: string }> {
  const client = getClient();
  const response = await client.send(
    new GetObjectCommand({
      Bucket: getBucket(),
      Key: key,
    })
  );

  const stream = response.Body;
  if (!stream) throw new Error("Empty response body from S3");

  const chunks: Uint8Array[] = [];
  // @ts-expect-error - stream is async iterable in Node.js
  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return {
    buffer: Buffer.concat(chunks),
    contentType: response.ContentType || "application/octet-stream",
  };
}

/**
 * Get metadata (size, content type) for an S3 object without downloading it.
 */
export async function getS3ObjectInfo(
  key: string
): Promise<{ contentLength: number; contentType: string }> {
  const client = getClient();
  const response = await client.send(
    new HeadObjectCommand({
      Bucket: getBucket(),
      Key: key,
    })
  );
  return {
    contentLength: response.ContentLength ?? 0,
    contentType: response.ContentType || "application/octet-stream",
  };
}

/**
 * Get a byte range from an S3 object (for HTTP 206 Partial Content responses).
 */
export async function getS3Range(
  key: string,
  start: number,
  end: number
): Promise<{ buffer: Buffer; contentType: string }> {
  const client = getClient();
  const response = await client.send(
    new GetObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Range: `bytes=${start}-${end}`,
    })
  );

  const stream = response.Body;
  if (!stream) throw new Error("Empty response body from S3");

  const chunks: Uint8Array[] = [];
  for await (const chunk of stream as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }

  return {
    buffer: Buffer.concat(chunks),
    contentType: response.ContentType || "application/octet-stream",
  };
}

/**
 * Check if an object exists in S3.
 */
export async function existsInS3(key: string): Promise<boolean> {
  const client = getClient();
  try {
    await client.send(
      new HeadObjectCommand({
        Bucket: getBucket(),
        Key: key,
      })
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a signed URL for direct access to an S3 object.
 * Default expiry: 1 hour.
 */
export async function getSignedS3Url(key: string, expiresIn = 3600): Promise<string> {
  const client = getClient();
  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: getBucket(),
      Key: key,
    }),
    { expiresIn }
  );
}
