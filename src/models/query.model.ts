import { z } from "zod";

export const createQuerySchema = (
  allowedSortFields: readonly string[],
  defaultSortField: string = "id",
) => {
  return z
    .object({
      _page: z.coerce.number().min(1).default(1),
      _limit: z.coerce.number().min(1).max(200).default(20),
      _sort: z.string().optional(),
      _order: z.enum(["asc", "desc"]).default("desc"),
      q: z.string().max(100).optional(),
    })
    .transform(({ _sort, _order, ...rest }) => {
      let safeSortField = defaultSortField;

      if (_sort) {
        const field = _sort.split(",")[0].trim();
        if (allowedSortFields.includes(field)) {
          safeSortField = field;
        }
      }

      return {
        ...rest,
        sort: { field: safeSortField, order: _order },
      };
    });
};
