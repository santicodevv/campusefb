import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as qs from 'qs';

@Injectable()
export class MoodleClientService {
  private readonly logger = new Logger(MoodleClientService.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly moodleUrl: string;
  private readonly moodleToken: string;

  constructor(private readonly configService: ConfigService) {
    this.moodleUrl = this.configService.get<string>('MOODLE_URL') || '';
    this.moodleToken = this.configService.get<string>('MOODLE_TOKEN') || '';

    if (!this.moodleUrl || !this.moodleToken) {
      this.logger.warn(
        'MOODLE_URL or MOODLE_TOKEN not configured. Moodle integration will not work.',
      );
    }

    this.axiosInstance = axios.create({
      baseURL: `${this.moodleUrl}/webservice/rest`,
      timeout: 30000,
      // encodeValuesOnly: true preserva los corchetes en las claves de arrays (courses[0][name])
      // pero sí codifica los valores, evitando el error "unescaped characters" con tildes/ñ/etc.
      paramsSerializer: {
        serialize: (params) =>
          qs.stringify(params, {
            arrayFormat: 'indices',
            encodeValuesOnly: true,
          }),
      },
    });
  }

  async callFunction(wsfunction: string, params: any = {}): Promise<any> {
    // Check configuration before making request
    if (!this.moodleUrl || !this.moodleToken) {
      throw new Error(
        'Moodle no está configurado. Verifique MOODLE_URL y MOODLE_TOKEN en las variables de entorno.',
      );
    }

    try {
      this.logger.debug(`Calling Moodle function: ${wsfunction}`);

      const response = await this.axiosInstance.get('/server.php', {
        params: {
          wstoken: this.moodleToken,
          wsfunction,
          moodlewsrestformat: 'json',
          ...params,
        },
      });

      if (response.data.exception) {
        const errorMessage = response.data.message || response.data.exception;
        this.logger.error(`Moodle API error in ${wsfunction}: ${errorMessage}`);
        throw new Error(`Moodle error: ${errorMessage}`);
      }

      return response.data;
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        this.logger.error(
          `Cannot connect to Moodle at ${this.moodleUrl}: ${error.message}`,
        );
        throw new Error(
          `No se puede conectar con Moodle. Verifique que la URL sea correcta: ${this.moodleUrl}`,
        );
      }

      if (error.code === 'ETIMEDOUT') {
        this.logger.error(`Moodle request timeout for ${wsfunction}`);
        throw new Error(
          'La solicitud a Moodle ha excedido el tiempo de espera.',
        );
      }

      this.logger.error(
        `Error calling Moodle function ${wsfunction}: ${error.message}`,
      );
      throw error;
    }
  }

  // Obtener usuarios
  async getUsers(
    criteria: { key: string; value: string }[] = [],
  ): Promise<any[]> {
    // Si no hay criterios, obtener todos los usuarios con email no vacío
    const searchCriteria =
      criteria.length > 0 ? criteria : [{ key: 'email', value: '%' }];

    const result = await this.callFunction('core_user_get_users', {
      criteria: searchCriteria,
    });

    return result.users || [];
  }

  // Obtener cursos
  async getCourses(): Promise<any[]> {
    return this.callFunction('core_course_get_courses');
  }

  // Obtener usuarios matriculados en un curso
  async getEnrolledUsers(courseid: number): Promise<any[]> {
    return this.callFunction('core_enrol_get_enrolled_users', { courseid });
  }

  // Obtener elementos de calificación de un curso
  async getGradeItems(courseid: number): Promise<any> {
    return this.callFunction('core_grades_get_grade_items', { courseid });
  }

  // Obtener calificaciones
  async getGrades(courseid: number, userids: number[] = []): Promise<any> {
    return this.callFunction('gradereport_user_get_grade_items', {
      courseid,
      userids,
    });
  }

  // Actualizar calificación
  async updateGrade(
    courseid: number,
    itemid: number,
    userid: number,
    grade: number,
    feedback?: string,
  ): Promise<any> {
    return this.callFunction('core_grades_update_grades', {
      source: 'mod/assign',
      courseid,
      component: 'mod_assign',
      activityid: itemid,
      itemnumber: 0,
      grades: [
        {
          studentid: userid,
          grade,
          str_feedback: feedback || '',
        },
      ],
    });
  }

  // Crear matrícula
  async enrolUser(
    courseid: number,
    userid: number,
    roleid: number = 5, // 5 = student role por defecto
  ): Promise<any> {
    return this.callFunction('enrol_manual_enrol_users', {
      enrolments: [
        {
          roleid,
          userid,
          courseid,
        },
      ],
    });
  }

  // Actualizar usuario en Moodle
  async updateUser(
    moodleUserId: number,
    data: {
      email?: string;
      firstname?: string;
      lastname?: string;
      password?: string;
      suspended?: boolean;
    },
  ): Promise<any> {
    const userUpdate: any = { id: moodleUserId };
    if (data.email) userUpdate.email = data.email;
    if (data.firstname) userUpdate.firstname = data.firstname;
    if (data.lastname) userUpdate.lastname = data.lastname;
    if (data.password) userUpdate.password = data.password;
    if (data.suspended !== undefined)
      userUpdate.suspended = data.suspended ? 1 : 0;

    return this.callFunction('core_user_update_users', {
      users: [userUpdate],
    });
  }

  // Suspender matrícula
  async suspendEnrolment(courseid: number, userid: number): Promise<any> {
    return this.callFunction('enrol_manual_unenrol_users', {
      enrolments: [
        {
          userid,
          courseid,
        },
      ],
    });
  }

  // Obtener categorías de cursos
  async getCategories(): Promise<any[]> {
    this.logger.log('Fetching categories from Moodle...');
    const result = await this.callFunction('core_course_get_categories');
    this.logger.log(`Moodle categories response: ${JSON.stringify(result)}`);

    // core_course_get_categories devuelve un array directamente
    if (Array.isArray(result)) {
      return result;
    }

    // Si no es un array, retornar array vacío
    this.logger.warn('Unexpected response format from Moodle categories API');
    return [];
  }

  /**
   * Crear un usuario en Moodle
   * Retorna el moodleUserId del usuario recién creado
   */
  async createMoodleUser(userData: {
    username: string;
    password: string;
    firstname: string;
    lastname: string;
    email: string;
  }): Promise<number> {
    const result = await this.callFunction('core_user_create_users', {
      users: [
        {
          username: userData.username,
          password: userData.password,
          firstname: userData.firstname,
          lastname: userData.lastname,
          email: userData.email,
          auth: 'manual',
        },
      ],
    });

    if (!Array.isArray(result) || result.length === 0) {
      throw new Error('Moodle no devolvió un ID de usuario válido');
    }

    return result[0].id as number;
  }

  async createCourse(courseData: {
    fullname: string;
    shortname: string;
    categoryid: number;
    idnumber?: string;
    summary?: string;
    visible?: number;
    startdate?: number;
    enddate?: number;
  }): Promise<any[]> {
    return this.callFunction('core_course_create_courses', {
      courses: [
        {
          fullname: courseData.fullname,
          shortname: courseData.shortname,
          categoryid: courseData.categoryid,
          idnumber: courseData.idnumber || '',
          summary: courseData.summary || '',
          visible: courseData.visible ?? 1,
          startdate: courseData.startdate,
          enddate: courseData.enddate,
        },
      ],
    });
  }

  // Actualizar visibilidad de un curso en Moodle
  async updateCourseVisibility(
    moodleCourseId: number,
    visible: boolean,
  ): Promise<any> {
    // Use POST for course updates as Moodle handles complex arrays better with POST
    if (!this.moodleUrl || !this.moodleToken) {
      throw new Error(
        'Moodle no está configurado. Verifique MOODLE_URL y MOODLE_TOKEN en las variables de entorno.',
      );
    }

    try {
      this.logger.debug(
        `Updating course visibility in Moodle: courseId=${moodleCourseId}, visible=${visible}`,
      );

      const response = await this.axiosInstance.post(
        '/server.php',
        qs.stringify(
          {
            wstoken: this.moodleToken,
            wsfunction: 'core_course_update_courses',
            moodlewsrestformat: 'json',
            'courses[0][id]': moodleCourseId,
            'courses[0][visible]': visible ? 1 : 0,
          },
          { encode: false },
        ),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      if (response.data?.exception) {
        const errorMessage = response.data.message || response.data.exception;
        this.logger.error(`Moodle API error: ${errorMessage}`);
        throw new Error(`Moodle error: ${errorMessage}`);
      }

      return response.data;
    } catch (error) {
      this.logger.error(`Error updating course visibility: ${error.message}`);
      throw error;
    }
  }
}
