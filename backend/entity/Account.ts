import {BaseEntity, Entity, PrimaryColumn, Column} from "typeorm";

@Entity()
export class Account extends BaseEntity {
  @PrimaryColumn()
  username: string;

  @Column()
  password: string;
}
