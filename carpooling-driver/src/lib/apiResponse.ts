type PlainObject = Record<string, unknown>;

const isPlainObject = (value: unknown): value is PlainObject =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const unwrapApiData = <T>(responseData: unknown): T => {
  if (!isPlainObject(responseData)) {
    return responseData as T;
  }

  if ("success" in responseData && "data" in responseData) {
    const envelopeData = (responseData as { data?: unknown }).data;

    if (isPlainObject(envelopeData) && "data" in envelopeData) {
      const record = envelopeData as PlainObject;
      const nestedData = record.data;
      const keys = Object.keys(record);
      const isWrappedCollection =
        Array.isArray(nestedData) ||
        keys.every((key) => key === "data" || key === "meta");

      if (isWrappedCollection) {
        return nestedData as T;
      }
    }

    return envelopeData as T;
  }

  return responseData as T;
};

export const unwrapApiListData = <T>(responseData: unknown): T[] => {
  const data = unwrapApiData<unknown>(responseData);

  if (Array.isArray(data)) {
    return data as T[];
  }

  if (isPlainObject(data)) {
    if (Array.isArray(data.data)) {
      return data.data as T[];
    }

    if (Array.isArray(data.trips)) {
      return data.trips as T[];
    }

    if (Array.isArray(data.bookings)) {
      return data.bookings as T[];
    }

    if (Array.isArray(data.messages)) {
      return data.messages as T[];
    }

    if (Array.isArray(data.items)) {
      return data.items as T[];
    }
  }

  return [];
};
