import { PaginationQuery } from '../../common/pagination';

export class ListBrandsDto implements PaginationQuery {
    page?: string;
    limit?: string;
    search?: string;
}
