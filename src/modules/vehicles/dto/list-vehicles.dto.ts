import { PaginationQuery } from '../../../common/pagination';

export class ListVehiclesDto implements PaginationQuery {
    page?: string;
    limit?: string;
    search?: string;
    model_id?: string;
    brand_id?: string;
    year?: string;
}
