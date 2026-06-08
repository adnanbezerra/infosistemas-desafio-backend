import { PaginationQuery } from '../../common/pagination';

export class ListModelsDto implements PaginationQuery {
    page?: string;
    limit?: string;
    search?: string;
    brand_id?: string;
}
